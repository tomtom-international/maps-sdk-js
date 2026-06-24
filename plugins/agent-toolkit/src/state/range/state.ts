/**
 * @module agent-toolkit-state
 */

import {
    GeometriesModule,
    type GeometryTheme,
    PlacesModule,
    reachableRangeGeometryConfig,
    type TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { collapseHistoryToLatest, hideAllEntries } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { RangesEntry } from './entry';

/**
 * Events fired by {@link RangeState}. Subscribe via `state.ranges.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type RangeStateEvents = {
    /**
     * Range history changed — entry added or cleared via `reset()`. `entries` is the full snapshot
     * after the change; `changedIds` lists the ids of the entries this specific change added,
     * replaced in place, or removed.
     */
    'entries-change': { entries: readonly RangesEntry[]; changedIds: readonly string[] };
    /** Set of ranges entries currently rendered on the map changed (multi-show under `multiple`). */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

/**
 * State for reachable range results.
 *
 * Stores semantic summaries of calculated ranges (origin, budgets).
 * Also retains raw polygon geometry internally for use in geometry searches
 * (e.g. discoverPlaces withinRange). Displayed on the map via GeometriesModule.
 *
 * @group Agent Toolkit
 */
export class RangeState implements ShownEntriesSlice {
    private _entries: RangesEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link RangeStateEvents}. */
    readonly events = new StateEvents<RangeStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    /** Set of ranges-entry ids currently rendered on the map. */
    get shownEntryIds(): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) if (entry._shown) out.add(entry.id);
        return out;
    }

    /**
     * Display policy: `multiple` (default) lets several reachable-area entries render side
     * by side; `single` forces "at most one ranges entry on the map" — `markEntryShown`
     * then hides any previously-shown entry first.
     */
    get entryMode(): EntryMode {
        return this._entryMode;
    }

    /**
     * Switch the display policy. When moving from `multiple` → `single` we hide every
     * non-latest entry, drop them from history, and emit `entries-change`. No-op when the
     * mode hasn't changed.
     */
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

    /**
     * Lazy-init the entry's GeometriesModule (for the isochrone/isodistance polygons),
     * applying the requested theme. Throws on unknown id.
     */
    async getEntryGeometriesModule(entryId: string, theme: GeometryTheme = 'outline'): Promise<GeometriesModule> {
        const entry = this._requireEntry(entryId);
        entry._modules ??= {};
        if (!entry._modules.geometries) {
            entry._modules.geometries = await GeometriesModule.get(
                this._ttMap,
                reachableRangeGeometryConfig(undefined, theme),
            );
            entry._shownTheme = theme;
        } else if (entry._shownTheme !== theme) {
            entry._modules.geometries.applyConfig(reachableRangeGeometryConfig(undefined, theme));
            entry._shownTheme = theme;
        }
        return entry._modules.geometries;
    }

    /**
     * Lazy-init the entry's origin-pin PlacesModule. Each entry maintains its own pin module
     * so multiple ranges entries can be on the map simultaneously without the pins of one
     * overwriting another.
     */
    async getEntryPlacesModule(entryId: string): Promise<PlacesModule> {
        const entry = this._requireEntry(entryId);
        entry._modules ??= {};
        if (!entry._modules.places) {
            entry._modules.places = await PlacesModule.get(this._ttMap);
        }
        return entry._modules.places;
    }

    /**
     * Mark this entry as shown — records `_shown = true` and emits `shown-change`. The
     * caller is expected to push features into the lazy modules itself; this method only
     * keeps the `_shown` flag in sync with what the user sees.
     *
     * Under `entryMode === 'single'` any other shown entry is hidden first so two range
     * layers don't overlap.
     */
    async markEntryShown(entryId: string): Promise<void> {
        const entry = this._requireEntry(entryId);
        if (this._entryMode === 'single') {
            const others = this._entries.filter((e) => e._shown && e.id !== entryId);
            for (const other of others) await this.hideEntry(other.id);
        }
        const wasShown = entry._shown;
        entry._shown = true;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /** Hide every module on the entry (clear). No-op when the entry is unknown. */
    async hideEntry(entryId: string): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._shown) return;
        if (entry._modules?.geometries) await entry._modules.geometries.clear();
        if (entry._modules?.places) await entry._modules.places.clear();
        entry._shown = false;
        this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Drop a single entry from history. Hides it from the map first (clears its geometries +
     * origin-pin modules) then removes it from `_entries`. Emits `entries-change`. No-op when
     * the id is unknown.
     */
    async removeEntry(entryId: string): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return;
        await this.hideEntry(entryId);
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', { entries: this._entries, changedIds: [entryId] });
    }

    private _requireEntry(entryId: string): RangesEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`RangeState: unknown entry "${entryId}"`);
        return entry;
    }

    get entries(): readonly RangesEntry[] {
        return this._entries;
    }

    get latestEntry(): RangesEntry | undefined {
        return this._entries.at(-1);
    }

    async addEntry(entry: Omit<RangesEntry, 'id' | 'timestamp'>): Promise<string> {
        const droppedIds = this._entryMode === 'single' ? this._entries.map((existing) => existing.id) : [];
        if (this._entryMode === 'single' && this._entries.length > 0) {
            await hideAllEntries(this._entries, (existing) => this.hideEntry(existing.id));
            this._entries = [];
        }
        const id = `ranges-${this._entries.length}`;
        this._entries.push({
            id,
            timestamp: Date.now(),
            ...entry,
        });
        this.events.emit('entries-change', { entries: this._entries, changedIds: [...droppedIds, id] });
        return id;
    }

    /**
     * Hide every reachable-range entry currently on the map. Map-only — history is kept.
     * Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        const clearedIds = this._entries.map((entry) => entry.id);
        for (const entry of this._entries) {
            entry._modules?.geometries?.clear();
            entry._modules?.places?.clear();
        }
        this._entries = [];
        this.events.emit('entries-change', { entries: this._entries, changedIds: clearedIds });
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
