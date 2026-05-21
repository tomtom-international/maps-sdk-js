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
import { defaultLayersFor } from './layer-defaults';

/**
 * Events fired by {@link BYODState}. Subscribe via `state.byod.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type BYODStateEvents = {
    /** History changed — entry added, removed, or cleared via `reset()`. */
    'entries-change': readonly BYODEntry[];
    /** Set of entries currently rendered on the map changed. */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

/**
 * Options accepted by {@link BYODState.addEntry}.
 *
 * @group Agent Toolkit
 */
export type AddBYODEntryOptions = {
    /**
     * Explicit MapLibre layer specs. When omitted, the slice inspects the
     * FeatureCollection and picks defaults by geometry type
     * (Point → circle, Line → line, Polygon → fill). Mixed-kind entries get
     * one layer per kind present.
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
            this._entries = await collapseHistoryToLatest(this._entries, (entry) => this.hideEntry(entry.id));
            this.events.emit('entries-change', this._entries);
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
            layers: options.layers ?? defaultLayersFor(data),
        });
        this.events.emit('entries-change', this._entries);
        return entryId;
    }

    /**
     * Lazy-init the entry's CustomGeoJSONModule. The module is created with a
     * single source named `data`, configured with this entry's `layers`. Layer
     * changes after creation are not supported — drop the entry and add it back
     * to swap layers.
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
        this.events.emit('entries-change', this._entries);
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
        for (const entry of this._entries) entry._module?.clear().catch(() => undefined);
        this._entries = [];
        this.events.emit('entries-change', this._entries);
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
