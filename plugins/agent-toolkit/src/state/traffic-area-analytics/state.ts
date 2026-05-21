/**
 * @module agent-toolkit-state
 */

import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { type TomTomMap, type TrafficAreaAnalyticsConfig, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import type { StateSlice } from '../../types';
import { collapseHistoryToLatest, hideAllEntries, pickUniqueEntryId } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { TrafficAreaAnalyticsAnalysis } from './analysis';
import type { TrafficAreaAnalyticsEntry, TrafficAreaAnalyticsParams } from './entry';

/**
 * Events fired by {@link TrafficAreaAnalyticsState}. Subscribe via
 * `state.trafficAreaAnalytics.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type TrafficAreaAnalyticsStateEvents = {
    /** History changed — entry added, removed, or cleared via `reset()`. */
    'entries-change': readonly TrafficAreaAnalyticsEntry[];
    /** Set of entries currently rendered on the map changed. */
    'shown-change': ReadonlySet<string>;
    /** Per-entry viz config changed (mode / metric / scaleMode / …). */
    'config-change': { entryId: string; config: TrafficAreaAnalyticsConfig | undefined };
    /** A new analysis was attached to (or replaced on) an entry. */
    'analysis-added': { entryId: string; analysis: TrafficAreaAnalyticsAnalysis };
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

/**
 * Append-only history of traffic-area-analytics aggregations, with per-entry
 * rendering. Each entry owns a dedicated {@link TrafficAreaAnalyticsModule},
 * lazy-initialised on first show. Mirrors the per-entry pattern used by
 * `RoutingState` / `CustomGeometriesState`.
 *
 * Live tile overlays (flow + incidents) live in {@link TrafficTilesState}.
 *
 * @group Agent Toolkit
 */
export class TrafficAreaAnalyticsState implements ShownEntriesSlice, StateSlice {
    private _entries: TrafficAreaAnalyticsEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link TrafficAreaAnalyticsStateEvents}. */
    readonly events = new StateEvents<TrafficAreaAnalyticsStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    get entries(): readonly TrafficAreaAnalyticsEntry[] {
        return this._entries;
    }

    get latestEntry(): TrafficAreaAnalyticsEntry | undefined {
        return this._entries.at(-1);
    }

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

    findById(entryId: string): TrafficAreaAnalyticsEntry | undefined {
        return this._entries.find((e) => e.id === entryId);
    }

    /**
     * Append a new entry. Auto-suffixes the id on collision. Under `single` mode the new entry
     * replaces every older one (hidden + dropped from history).
     */
    async addEntry(
        data: TrafficAreaAnalytics,
        label: string,
        params: TrafficAreaAnalyticsParams,
        explicitId?: string,
    ): Promise<string> {
        if (this._entryMode === 'single' && this._entries.length > 0) {
            await hideAllEntries(this._entries, (entry) => this.hideEntry(entry.id));
            this._entries = [];
        }
        const fallback = `tta-${this._entries.length}`;
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
            data,
            params,
        });
        this.events.emit('entries-change', this._entries);
        return entryId;
    }

    /**
     * Attach an analysis to an existing entry. Replaces the prior result keyed by `analysis.name`
     * on the same entry (mirrors PlacesState / CustomGeometriesState semantics). Returns `false`
     * when the entry id is unknown.
     */
    addAnalysisToEntry(entryId: string, analysis: TrafficAreaAnalyticsAnalysis): boolean {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return false;
        entry._analysis ??= [];
        const existingIdx = entry._analysis.findIndex((a) => a.name === analysis.name);
        if (existingIdx >= 0) {
            entry._analysis[existingIdx] = analysis;
        } else {
            entry._analysis.push(analysis);
        }
        this.events.emit('analysis-added', { entryId, analysis });
        this.events.emit('entries-change', this._entries);
        return true;
    }

    /**
     * Lazy-init the entry's TrafficAreaAnalyticsModule, wiring per-entry config-change events.
     * Throws on unknown id.
     */
    async getEntryModule(entryId: string): Promise<TrafficAreaAnalyticsModule> {
        const entry = this._requireEntry(entryId);
        if (!entry._module) {
            entry._module = await TrafficAreaAnalyticsModule.get(this._ttMap);
            entry._configChangeUnsub = entry._module.events.on('config-change', (config) => {
                entry._config = config;
                this.events.emit('config-change', { entryId, config });
            });
        }
        return entry._module;
    }

    /** Render this entry's analytics on its own module. Under `single` mode, hides every other shown entry first. */
    async showEntry(entryId: string): Promise<void> {
        const entry = this._requireEntry(entryId);
        if (this._entryMode === 'single') {
            const others = this._entries.filter((e) => e._shown && e.id !== entryId);
            for (const other of others) await this.hideEntry(other.id);
        }
        const module = await this.getEntryModule(entryId);
        await module.clear();
        await module.show(entry.data);
        const wasShown = entry._shown;
        entry._shown = true;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /** Hide the entry's analytics on its module. No-op when unknown or already hidden. */
    async hideEntry(entryId: string): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._shown) return;
        await entry._module?.clear();
        entry._shown = false;
        this.events.emit('shown-change', this.shownEntryIds);
    }

    /** Drop a single entry from history. Hides it first, then removes; emits `entries-change`. No-op on unknown id. */
    async removeEntry(entryId: string): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return;
        await this.hideEntry(entryId);
        const entry = this._entries[idx];
        entry._configChangeUnsub?.();
        entry._configChangeUnsub = undefined;
        entry._module = undefined;
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', this._entries);
    }

    private _requireEntry(entryId: string): TrafficAreaAnalyticsEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`TrafficAreaAnalyticsState: unknown entry "${entryId}"`);
        return entry;
    }

    /**
     * Hide every traffic-area-analytics entry currently on the map. Map-only — history is kept.
     * Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        for (const entry of this._entries) {
            entry._configChangeUnsub?.();
            entry._module?.clear();
        }
        this._entries = [];
        this.events.emit('entries-change', this._entries);
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
