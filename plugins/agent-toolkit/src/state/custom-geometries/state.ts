/**
 * @module agent-toolkit-state
 */

import type { CommonPlaceProps, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, type GeometryTheme, type TomTomMap, themedGeometryConfig } from '@tomtom-org/maps-sdk/map';
import type { StateSlice } from '../../types';
import { collapseHistoryToLatest, hideAllEntries, pickUniqueEntryId } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { CustomGeometriesEntry } from './entry';

/**
 * Events fired by {@link CustomGeometriesState}. Subscribe via
 * `state.customGeometries.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type CustomGeometriesStateEvents = {
    /**
     * History changed — entry added or cleared via `reset()`. `entries` is the full snapshot after
     * the change; `changedIds` lists the ids of the entries this specific change added, replaced in
     * place, or removed.
     */
    'entries-change': { entries: readonly CustomGeometriesEntry[]; changedIds: readonly string[] };
    /** Set of entries currently rendered on the map changed. */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

// Dedupe features by their string `id`. Features without a string id are kept as-is (cannot
// be deduped against anything).
const dedupeById = (features: PolygonFeature<CommonPlaceProps>[]): PolygonFeature<CommonPlaceProps>[] => {
    const seen = new Set<string>();
    const out: PolygonFeature<CommonPlaceProps>[] = [];
    for (const feature of features) {
        const featureId = typeof feature.id === 'string' ? feature.id : undefined;
        if (featureId) {
            if (seen.has(featureId)) continue;
            seen.add(featureId);
        }
        out.push(feature);
    }
    return out;
};

// Replace the module's currently-rendered FeatureCollection with `features`. An empty list
// clears the layer.
const renderReplace = async (module: GeometriesModule, features: PolygonFeature<CommonPlaceProps>[]): Promise<void> => {
    if (features.length === 0) {
        await module.clear();
        return;
    }
    await module.show({ type: 'FeatureCollection', features });
};

// Merge `features` with whatever the module is currently rendering, deduped by feature id.
// Empty input is a no-op (leaves whatever is on the layer in place).
const renderMerged = async (module: GeometriesModule, features: PolygonFeature<CommonPlaceProps>[]): Promise<void> => {
    if (features.length === 0) return;
    const current = (module.getShown().geometry.features ?? []) as PolygonFeature<CommonPlaceProps>[];
    const merged = dedupeById([...current, ...features]);
    await module.show({ type: 'FeatureCollection', features: merged });
};

/**
 * State for derived / custom geometries — output of `processData` and any future
 * polygon-producing tool whose result doesn't belong to a place or a reachable-range entry.
 *
 * Each entry owns a dedicated GeometriesModule, lazy-initialised on first show, mirroring
 * the per-entry display model used by {@link RangeState}. Provenance metadata captures the
 * input sources (tagged ids) and the operation that produced the polygons.
 *
 * @group Agent Toolkit
 */
export class CustomGeometriesState implements ShownEntriesSlice, StateSlice {
    private _entries: CustomGeometriesEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link CustomGeometriesStateEvents}. */
    readonly events = new StateEvents<CustomGeometriesStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    get entries(): readonly CustomGeometriesEntry[] {
        return this._entries;
    }

    get latestEntry(): CustomGeometriesEntry | undefined {
        return this._entries.at(-1);
    }

    /** Set of custom-geometries entry ids currently rendered on the map. */
    get shownEntryIds(): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) if (entry._shown) out.add(entry.id);
        return out;
    }

    /**
     * Display policy: `multiple` (default) lets several derived-geometry entries render side
     * by side; `single` enforces "at most one entry on the map" — switching to it auto-hides
     * older entries.
     */
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

    findById(entryId: string): CustomGeometriesEntry | undefined {
        return this._entries.find((e) => e.id === entryId);
    }

    /**
     * Append a new entry. If `explicitId` collides, the slice auto-suffixes (`-2`, `-3`, ...).
     * Returns the assigned id. Under `single` mode the new entry replaces every older one.
     */
    async addEntry(
        features: PolygonFeature<CommonPlaceProps>[],
        provenance: CustomGeometriesEntry['provenance'],
        label: string,
        explicitId?: string,
    ): Promise<string> {
        const droppedIds = this._entryMode === 'single' ? this._entries.map((entry) => entry.id) : [];
        if (this._entryMode === 'single' && this._entries.length > 0) {
            await hideAllEntries(this._entries, (entry) => this.hideEntry(entry.id));
            this._entries = [];
        }
        const fallback = `geometries-${this._entries.length}`;
        const entryId = explicitId
            ? pickUniqueEntryId(
                  explicitId,
                  this._entries.map((entry) => entry.id),
              )
            : fallback;
        this._entries.push({
            id: entryId,
            timestamp: Date.now(),
            label,
            features,
            provenance,
        });
        this.events.emit('entries-change', { entries: this._entries, changedIds: [...droppedIds, entryId] });
        return entryId;
    }

    /** Lazy-init the entry's GeometriesModule, applying / re-applying the requested theme. */
    async getEntryGeometriesModule(entryId: string, theme: GeometryTheme = 'outline'): Promise<GeometriesModule> {
        const entry = this._requireEntry(entryId);
        // Module-level `theme` flows into `prepareGeometryForDisplay` and is used as the
        // effective theme for every feature that doesn't carry its own `properties.theme`.
        const config = { ...themedGeometryConfig(), theme };
        if (!entry._module) {
            entry._module = await GeometriesModule.get(this._ttMap, config);
            entry._shownTheme = theme;
        } else if (entry._shownTheme !== theme) {
            entry._module.applyConfig(config);
            entry._shownTheme = theme;
        }
        return entry._module;
    }

    /**
     * Render this entry's polygons. `mode` is scoped to this entry's own layer:
     * - `'replace'` (default) — show exactly `entry.features`, clearing whatever the
     *   entry's module had rendered before.
     * - `'add'` — merge `entry.features` with the polygons currently shown on this entry's
     *   layer (deduped by feature id). Mostly only meaningful when re-showing the same entry.
     *
     * Cross-entry visibility is handled separately: under `entryMode === 'single'` other
     * shown entries are hidden first; otherwise the caller uses `hideEntry` / the
     * tools' `hidePreviousEntries` option.
     */
    async showEntry(
        entryId: string,
        theme: GeometryTheme = 'outline',
        mode: 'add' | 'replace' = 'replace',
    ): Promise<void> {
        const entry = this._requireEntry(entryId);
        await this._hideOthersUnderSingleMode(entryId);
        const module = await this.getEntryGeometriesModule(entryId, theme);
        const features = entry.features as PolygonFeature<CommonPlaceProps>[];
        if (mode === 'add') {
            await renderMerged(module, features);
        } else {
            await renderReplace(module, features);
        }
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
        if (entry._module) await entry._module.clear();
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

    private _requireEntry(entryId: string): CustomGeometriesEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`CustomGeometriesState: unknown entry "${entryId}"`);
        return entry;
    }

    /**
     * Hide every custom-geometries entry currently on the map. Map-only — history is kept.
     * Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        const clearedIds = this._entries.map((entry) => entry.id);
        for (const entry of this._entries) entry._module?.clear();
        this._entries = [];
        this.events.emit('entries-change', { entries: this._entries, changedIds: clearedIds });
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
