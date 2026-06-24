/**
 * @module agent-toolkit-state
 */

import { type CustomGeoJSONLayerSpec, CustomGeoJSONModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection } from 'geojson';
import type { StateSlice } from '../../types';
import { collapseHistoryToLatest, hideAllEntries, pickUniqueEntryId } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { BYODEntry, BYODSource } from './entry';
import { profileFeatureCollection } from './profile';

/**
 * Events fired by {@link BYODState}. Subscribe via `state.byod.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type BYODStateEvents = {
    /**
     * History changed — entry added, removed, or cleared via `reset()`. `entries` is the full
     * snapshot after the change; `changedIds` lists the ids of the entries this specific change
     * added, replaced in place, or removed.
     */
    'entries-change': { entries: readonly BYODEntry[]; changedIds: readonly string[] };
    /** Set of entries currently rendered on the map changed. */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
    /** An analysis was attached to (or replaced on) an entry by `analyseData`. */
};

/**
 * Options accepted by {@link BYODState.addEntry}.
 *
 * @group Agent Toolkit
 */
export type AddBYODEntryOptions = {
    /**
     * Explicit MapLibre layer specs. Layers are never derived automatically:
     * when omitted the entry is created with no layers and renders nothing until
     * they are set — by the agent via `setByodLayers`, or by passing them here.
     */
    layers?: CustomGeoJSONLayerSpec[];
    /** Provenance for the data. Defaults to `{ kind: 'integrator' }`. */
    source?: BYODSource;
    /**
     * Semantic entry id. Auto-suffixed (`-2`, `-3`, …) on collision. Defaults
     * to `byod-N`.
     */
    explicitId?: string;
};

/**
 * Verdict returned by a {@link ByodSourceUrlValidator}: explicitly allow the fetch with
 * `{ valid: true }`, or block it with `{ valid: false, reason }` — the `reason` is surfaced
 * to the model as the tool error.
 *
 * @group Agent Toolkit
 */
export type ByodSourceUrlValidation = { valid: true } | { valid: false; reason: string };

/**
 * App-supplied authorization hook for BYOD source URLs. Runs inside
 * `addByodSource` AFTER the built-in scheme / size / timeout policy and BEFORE
 * the network fetch. Return `{ valid: true }` to allow the fetch or
 * `{ valid: false, reason }` to block it (see {@link ByodSourceUrlValidation}).
 * May be sync or async — e.g. an allowlist lookup.
 *
 * The toolkit can't enforce SSRF guarantees the host itself can't, so it leaves
 * the URL surface open by default; this hook lets a deployment add its own
 * policy — refuse cloud-metadata endpoints (`169.254.169.254`), restrict to
 * known hosts, etc. — without the SDK prescribing one for everyone. Configure
 * via the `byod.validateSourceUrl` option on `createMapAgent`, or assign
 * `state.byod.sourceUrlValidator` directly.
 *
 * @group Agent Toolkit
 */
export type ByodSourceUrlValidator = (url: URL) => ByodSourceUrlValidation | Promise<ByodSourceUrlValidation>;

/**
 * State slice for BYOD (bring-your-own-data) GeoJSON layers — customer-owned
 * data that doesn't fit places / routes / ranges / custom-geometries. Each
 * entry wraps a {@link CustomGeoJSONModule} so the agent can render, query,
 * and pipe it through analyseData / processData.
 *
 * Per-entry display model mirrors {@link CustomGeometriesState}: every entry
 * owns its own module, lazy-initialised on first show.
 *
 * @group Agent Toolkit
 */
export class BYODState implements ShownEntriesSlice, StateSlice {
    private _entries: BYODEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link BYODStateEvents}. */
    readonly events = new StateEvents<BYODStateEvents>();

    /**
     * Optional authorization hook for `addByodSource` URL fetches — see
     * {@link ByodSourceUrlValidator}. Unset = no restriction beyond the built-in
     * scheme / size / timeout policy.
     */
    sourceUrlValidator?: ByodSourceUrlValidator;

    constructor(private readonly _ttMap: TomTomMap) {}

    get entries(): readonly BYODEntry[] {
        return this._entries;
    }

    get latestEntry(): BYODEntry | undefined {
        return this._entries.at(-1);
    }

    /** Set of BYOD entry ids currently rendered on the map. */
    get shownEntryIds(): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) if (entry._shown) out.add(entry.id);
        return out;
    }

    get entryMode(): EntryMode {
        return this._entryMode;
    }

    async setEntryMode(mode: EntryMode): Promise<void> {
        if (this._entryMode === mode) return;
        this._entryMode = mode;
        if (mode === 'single' && this._entries.length > 1) {
            const droppedIds = this._entries.slice(0, -1).map((entry) => entry.id);
            this._entries = await collapseHistoryToLatest(this._entries, (entry) => this.hideEntry(entry.id));
            this.events.emit('entries-change', { entries: this._entries, changedIds: droppedIds });
        }
        this.events.emit('mode-change', mode);
    }

    findById(entryId: string): BYODEntry | undefined {
        return this._entries.find((e) => e.id === entryId);
    }

    /**
     * Append a new BYOD entry. Under `single` mode the new entry replaces every older one (hides
     * + drops them before the new entry is pushed, so the caller never sees the new entry
     * rendered on top of a still-visible old one). Returns the assigned id.
     */
    async addEntry(data: FeatureCollection, label: string, options: AddBYODEntryOptions = {}): Promise<string> {
        const droppedIds = this._entryMode === 'single' ? this._entries.map((entry) => entry.id) : [];
        if (this._entryMode === 'single' && this._entries.length > 0) {
            await hideAllEntries(this._entries, (entry) => this.hideEntry(entry.id));
            this._entries = [];
        }
        // Always run through `pickUniqueEntryId` — the bare `byod-${length}` fallback collides
        // when an earlier entry has been removed (e.g. add a, add b, remove a → length=1 and
        // the new fallback `byod-1` clashes with the surviving entry's id). The dedupe path
        // appends `-2`, `-3`, … on collision, matching the explicit-id behaviour.
        const entryId = pickUniqueEntryId(
            options.explicitId ?? `byod-${this._entries.length}`,
            this._entries.map((entry) => entry.id),
        );
        this._entries.push({
            id: entryId,
            timestamp: Date.now(),
            label,
            data,
            source: options.source ?? { kind: 'integrator' },
            layers: options.layers ?? [],
            profile: profileFeatureCollection(data),
        });
        this.events.emit('entries-change', { entries: this._entries, changedIds: [...droppedIds, entryId] });
        return entryId;
    }

    /**
     * Replace the MapLibre layer specs an entry renders under. When the entry already owns a
     * module (it has been shown at least once) the new specs are pushed live via the module's
     * `applyConfig` runtime layer diff — no tear-down, no flicker. When no module exists yet the
     * specs are stored and the next {@link showEntry} picks them up. Throws on an unknown id.
     */
    setEntryLayers(entryId: string, layers: CustomGeoJSONLayerSpec[]): void {
        const entry = this._requireEntry(entryId);
        entry.layers = layers;
        entry._module?.applyConfig({ sources: { data: { layers } } });
        this.events.emit('entries-change', { entries: this._entries, changedIds: [entryId] });
    }

    /**
     * Lazy-init the entry's CustomGeoJSONModule. The module is created with a
     * single source named `data`, configured with this entry's `layers`. To swap
     * layers after creation, call {@link setEntryLayers} — it pushes the new specs
     * into this module via `applyConfig` rather than recreating it.
     */
    async getEntryModule(entryId: string): Promise<CustomGeoJSONModule> {
        const entry = this._requireEntry(entryId);
        entry._module ??= await CustomGeoJSONModule.get(this._ttMap, {
            sources: { data: { layers: entry.layers } },
        });
        return entry._module;
    }

    /** Render this entry on the map. */
    async showEntry(entryId: string): Promise<void> {
        const entry = this._requireEntry(entryId);
        // An entry has no layers until they are set explicitly (via setByodLayers or addEntry).
        // CustomGeoJSONModule requires at least one layer, so a layer-less entry simply isn't
        // rendered yet — no-op rather than throw. It becomes visible once setByodLayers adds layers.
        if (entry.layers.length === 0) return;
        await this._hideOthersUnderSingleMode(entryId);
        const module = await this.getEntryModule(entryId);
        await module.show(entry.data, 'data');
        const wasShown = entry._shown;
        entry._shown = true;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    private async _hideOthersUnderSingleMode(entryId: string): Promise<void> {
        if (this._entryMode !== 'single') return;
        const others = this._entries.filter((e) => e._shown && e.id !== entryId);
        for (const other of others) await this.hideEntry(other.id);
    }

    async hideEntry(entryId: string): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._shown) return;
        await entry._module?.clear();
        entry._shown = false;
        this.events.emit('shown-change', this.shownEntryIds);
    }

    /** Drop a single entry from history (clears its module first). No-op when unknown. */
    async removeEntry(entryId: string): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return;
        await this.hideEntry(entryId);
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', { entries: this._entries, changedIds: [entryId] });
    }

    private _requireEntry(entryId: string): BYODEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`BYODState: unknown entry "${entryId}"`);
        return entry;
    }

    /**
     * Hide every BYOD layer currently on the map. Map-only — history is kept.
     * Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        const clearedIds = this._entries.map((entry) => entry.id);
        for (const entry of this._entries) entry._module?.clear().catch(() => undefined);
        this._entries = [];
        this.events.emit('entries-change', { entries: this._entries, changedIds: clearedIds });
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
