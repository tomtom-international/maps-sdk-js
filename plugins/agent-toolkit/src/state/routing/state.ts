/**
 * @module agent-toolkit-state
 */

import type { Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { PlanningWaypoint, RoutingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { RouteParams, RoutesEntry } from '../../types';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { RoutesAnalysis } from './analysis';

/**
 * Events fired by {@link RoutingState}. Subscribe via `state.routing.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type RoutingStateEvents = {
    /** Route history changed — new calculation stored, analysis attached, or cleared via `reset()`. */
    'entries-change': readonly RoutesEntry[];
    /** Sparse waypoint planning slots changed (origin/stop/destination assignment). */
    'planning-change': readonly PlanningWaypoint[];
    /** Route parameters (alternatives, cost model, depart/arrive time) changed. */
    'params-change': RouteParams;
    /** A new analysis was attached to (or replaced on) a routes entry. */
    'analysis-added': { entryId: string; analysis: RoutesAnalysis };
    /** Set of routes entries currently rendered on the map changed (multi-show under `multiple`). */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

/**
 * State for route calculation, waypoint management, and route planning parameters.
 *
 * Each entry carries its own lazy-initialised RoutingModule (`entry._module`), so display
 * state lives on the entry instead of a shared slice-level module. Two routes can be rendered
 * concurrently by showing both entries, and switching the active route hides the previous
 * entry's module without disturbing its calculated data.
 *
 * @group Agent Toolkit
 */
export class RoutingState implements ShownEntriesSlice {
    private _entries: RoutesEntry[] = [];
    private _planningSlots: PlanningWaypoint[] = [];
    private _params: RouteParams = {};
    private _entryMode: EntryMode = 'multiple';
    /**
     * The most recently `.showEntry`-ed id. Tracks "who was last brought up" so tools that
     * operate on the focused module (`set-route-theme`, `get-shown-routes`, …) have a single
     * pointer to read; the authoritative shown set is `shownEntryIds` (derived from each
     * entry's `_shown` flag).
     */
    private _lastShownEntryId?: string;

    /** Subscribe to state changes — see {@link RoutingStateEvents}. */
    readonly events = new StateEvents<RoutingStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    /** Set of routes-entry ids currently rendered on the map. */
    get shownEntryIds(): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) if (entry._shown) out.add(entry.id);
        return out;
    }

    /**
     * Display policy: `multiple` (default) lets several entries render side-by-side;
     * `single` forces "at most one route on the map" — `showEntry` then hides any
     * previously-shown entry first.
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
            const latest = this._entries.at(-1);
            const dropped = this._entries.slice(0, -1);
            for (const entry of dropped) await this.hideEntry(entry.id);
            this._entries = latest ? [latest] : [];
            this.events.emit('entries-change', this._entries);
        }
        this.events.emit('mode-change', mode);
    }

    /**
     * Lazy-init and return an entry's RoutingModule. Throws on unknown id. Callers that need
     * to show/hide should prefer the higher-level {@link showEntry} / {@link hideEntry}.
     */
    async getEntryRoutingModule(entryId: string): Promise<RoutingModule> {
        const entry = this._requireEntry(entryId);
        if (!entry._module) {
            entry._module = await RoutingModule.get(this._ttMap);
        }
        return entry._module;
    }

    /**
     * Render the given entry's routes + waypoints on its own RoutingModule.
     *
     * Under `entryMode === 'single'` any other shown entry is hidden first so two route
     * layers don't pile up. Under `entryMode === 'multiple'` previously-shown entries stay
     * rendered, letting the caller overlay several routes at once.
     *
     * Emits `shown-change` once the new entry is up.
     */
    async showEntry(entryId: string): Promise<void> {
        const entry = this._requireEntry(entryId);
        if (this._entryMode === 'single') {
            const others = this._entries.filter((e) => e._shown && e.id !== entryId);
            for (const other of others) await this.hideEntry(other.id);
        }
        const module = await this.getEntryRoutingModule(entryId);
        await module.showRoutes(entry.data);
        if (entry.waypoints.length) await module.showWaypoints(entry.waypoints);
        const wasShown = entry._shown;
        entry._shown = true;
        this._lastShownEntryId = entryId;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Hide the entry's routes + waypoints on its module (clear; the module stays cached).
     * No-op when the entry is unknown or already hidden.
     */
    async hideEntry(entryId: string): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry || !entry._shown) return;
        if (entry._module) {
            await entry._module.clearRoutes();
            await entry._module.clearWaypoints();
        }
        entry._shown = false;
        if (this._lastShownEntryId === entryId) {
            // Repoint to whichever entry is still rendering, or clear the
            // pointer if none is.
            this._lastShownEntryId = this._entries.findLast((e) => e._shown)?.id;
        }
        this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Drop a single entry from history. Hides it from the map first (clears its routing module)
     * then removes it from `_entries`. Emits `entries-change`. No-op when the id is unknown.
     */
    async removeEntry(entryId: string): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return;
        await this.hideEntry(entryId);
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', this._entries);
    }

    private _requireEntry(entryId: string): RoutesEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`RoutingState: unknown entry "${entryId}"`);
        return entry;
    }

    /**
     * RoutingModule of the most-recently-shown entry, if any. Tools that operate on the
     * "focused route" (e.g. setRouteTheme, getShownRoutes) read off it. Returns undefined
     * when no entry is currently shown.
     */
    get currentEntryModule(): RoutingModule | undefined {
        if (!this._lastShownEntryId) return undefined;
        const entry = this._entries.find((e) => e.id === this._lastShownEntryId);
        return entry?._shown ? entry._module : undefined;
    }

    // History

    get entries(): readonly RoutesEntry[] {
        return this._entries;
    }

    get currentRoutes(): Routes | undefined {
        return this._entries.at(-1)?.data;
    }

    get currentWaypoints(): WaypointLike[] | undefined {
        return this._entries.at(-1)?.waypoints;
    }

    /** Sparse nullable slots being assembled before triggering a route calculation. */
    get planningSlots(): PlanningWaypoint[] {
        return this._planningSlots;
    }

    get params(): RouteParams {
        return this._params;
    }

    addRoutes(routes: Routes, waypoints: WaypointLike[], label: string): string {
        if (this._entryMode === 'single' && this._entries.length > 0) {
            // Hide each existing entry's module so the map doesn't keep
            // showing the previous routes; we then drop them from history.
            for (const entry of this._entries) void this.hideEntry(entry.id);
            this._entries = [];
        }
        const id = `routes-${this._entries.length}`;
        this._entries.push({
            id,
            timestamp: Date.now(),
            label,
            data: routes,
            waypoints,
            params: { ...this._params },
        });
        this._planningSlots = [...waypoints];
        this.events.emit('entries-change', this._entries);
        this.events.emit('planning-change', this._planningSlots);
        return id;
    }

    /**
     * Attach an analysis result to an existing routes entry. Names are unique within a single
     * entry — adding one with an existing name replaces it. Returns true on success, false if
     * the entry doesn't exist.
     */
    addAnalysisToEntry(entryId: string, analysis: RoutesAnalysis): boolean {
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
        // Same reasoning as PlacesState.addAnalysisToEntry — analyses are attached in place,
        // re-emit entries-change so consumers re-render.
        this.events.emit('entries-change', this._entries);
        return true;
    }

    setWaypointAt(index: number, waypoint: WaypointLike): void {
        const minSize = Math.max(2, index + 1);
        while (this._planningSlots.length < minSize) {
            this._planningSlots.push(null);
        }
        this._planningSlots[index] = waypoint;
        this.events.emit('planning-change', this._planningSlots);
    }

    setParams(params: Partial<RouteParams>): void {
        this._params = { ...this._params, ...params };
        this.events.emit('params-change', this._params);
    }

    reset(): void {
        // Clear every entry's module so the map looks empty before the
        // references go away. Layers persist on the style — same trade-off the
        // previous shared-module reset had.
        for (const entry of this._entries) {
            entry._module?.clearRoutes();
            entry._module?.clearWaypoints();
        }
        this._entries = [];
        this._planningSlots = [];
        this._params = {};
        this._lastShownEntryId = undefined;
        this.events.emit('entries-change', this._entries);
        this.events.emit('planning-change', this._planningSlots);
        this.events.emit('params-change', this._params);
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
