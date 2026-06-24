/**
 * @module agent-toolkit-state
 */

import type { Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import { PlanningWaypoint, RoutingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import { collapseHistoryToLatest, hideAllEntries } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode, ShownEntriesSlice } from '../state';
import type { RouteParams, RoutesEntry } from './entry';
import { RouteMonitor, type RouteMonitorDeps } from './monitor/monitor';
import type { RouteSnapshot } from './monitor/types';

/**
 * Events fired by {@link RoutingState}. Subscribe via `state.routing.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type RoutingStateEvents = {
    /**
     * Route history changed — new calculation stored, analysis attached, or cleared via `reset()`.
     * `entries` is the full snapshot after the change; `changedIds` lists the ids of the entries
     * this specific change added, replaced in place, or removed.
     */
    'entries-change': { entries: readonly RoutesEntry[]; changedIds: readonly string[] };
    /** Sparse waypoint planning slots changed (origin/stop/destination assignment). */
    'planning-change': readonly PlanningWaypoint[];
    /** Route parameters (alternatives, cost model, depart/arrive time) changed. */
    'params-change': RouteParams;
    /** Set of routes entries currently rendered on the map changed (multi-show under `multiple`). */
    'shown-change': ReadonlySet<string>;
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
    /** Monitoring began on an entry (idle → running). Skipped when already running. */
    'monitor-start': { entryId: string };
    /**
     * Monitoring halted on an entry. `reason: 'manual'` covers explicit `stopMonitoring` and entry
     * teardown (remove / reset); `reason: 'error'` fires alongside `monitor-error`.
     */
    'monitor-stop': { entryId: string; reason: 'manual' | 'error' };
    /** A monitored route was recalculated (per-tick). The entry's data has been updated in place. */
    'monitor-tick': { entryId: string; snap: RouteSnapshot };
    /** A monitored route's recalculation failed — the monitor cleared its timer and stopped. */
    'monitor-error': { entryId: string; error: string };
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
     * Slice-level "main color" applied to every RoutingModule on first show / re-show. Sticky
     * across entry swaps so the rendered route always uses the most recently requested color.
     * Set via {@link setMainColor}; persists for the lifetime of the slice (cleared on `reset`).
     */
    private _mainColor?: string;
    /**
     * The most recently `.showEntry`-ed id. Tracks "who was last brought up" so tools that
     * operate on the focused module have a single pointer to read; the authoritative shown
     * set is `shownEntryIds` (derived from each entry's `_shown` flag).
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
            const droppedIds = this._entries.slice(0, -1).map((entry) => entry.id);
            this._entries = await collapseHistoryToLatest(this._entries, (entry) => this.hideEntry(entry.id));
            this.events.emit('entries-change', { entries: this._entries, changedIds: droppedIds });
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
     * Emits `shown-change` once the new entry is up. Pass `showWaypoints: false` to render the
     * route lines without origin/stop/destination pins, and `showSummaryBubbles: false` to drop the
     * per-route ETA bubbles (e.g. a monitored corridor backdrop).
     */
    async showEntry(entryId: string, opts?: { showWaypoints?: boolean; showSummaryBubbles?: boolean }): Promise<void> {
        const entry = this._requireEntry(entryId);
        if (this._entryMode === 'single') {
            const others = this._entries.filter((e) => e._shown && e.id !== entryId);
            for (const other of others) await this.hideEntry(other.id);
        }
        const module = await this.getEntryRoutingModule(entryId);
        // Apply the sticky main color + bubble visibility in ONE config BEFORE showing, so the first
        // paint already has the theme (no flash) and a single applyConfig doesn't clobber the other.
        const config: NonNullable<Parameters<typeof module.applyConfig>[0]> = {};
        if (this._mainColor !== undefined) config.theme = { mainColor: this._mainColor };
        // showRoutes gates the ETA bubbles on the top-level `summaryBubbles.visible` flag (NOT a
        // layer visibility), so that's what we set to drop them.
        if (opts?.showSummaryBubbles === false) config.summaryBubbles = { visible: false };
        if (config.theme || config.summaryBubbles) module.applyConfig(config);
        await module.showRoutes(entry.data);
        if (opts?.showWaypoints === false) {
            await module.clearWaypoints();
        } else if (entry.waypoints.length) {
            await module.showWaypoints(entry.waypoints);
        }
        const wasShown = entry._shown;
        entry._shown = true;
        this._lastShownEntryId = entryId;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /** Slice-level main color persisted across entry swaps. Undefined when no theme has been set. */
    get mainColor(): string | undefined {
        return this._mainColor;
    }

    /**
     * Set the slice-level main color. The colour is applied immediately to every currently-shown
     * entry's RoutingModule and remembered so that subsequent {@link showEntry} calls apply it
     * automatically. Pass `undefined` to clear the sticky theme — currently-shown modules keep
     * their last paint until they're re-shown (MapLibre style restore handles full revert).
     */
    setMainColor(color: string | undefined): void {
        this._mainColor = color;
        if (color === undefined) return;
        for (const entry of this._entries) {
            if (entry._shown && entry._module) {
                entry._module.applyConfig({ theme: { mainColor: color } });
            }
        }
    }

    /**
     * Hide the entry's routes + waypoints on its module (clear; the module stays cached).
     * No-op when the entry is unknown or already hidden.
     */
    async hideEntry(entryId: string): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._shown) return;
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
        this.stopMonitoring(entryId);
        await this.hideEntry(entryId);
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', { entries: this._entries, changedIds: [entryId] });
    }

    private _requireEntry(entryId: string): RoutesEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`RoutingState: unknown entry "${entryId}"`);
        return entry;
    }

    /**
     * RoutingModule of the most-recently-shown entry, if any. Returns undefined when no
     * entry is currently shown.
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

    async addRoutes(routes: Routes, waypoints: WaypointLike[], label: string): Promise<string> {
        const droppedIds = this._entryMode === 'single' ? this._entries.map((entry) => entry.id) : [];
        if (this._entryMode === 'single' && this._entries.length > 0) {
            // Hide each existing entry's module so the map doesn't keep
            // showing the previous routes; we then drop them from history.
            await hideAllEntries(this._entries, (entry) => this.hideEntry(entry.id));
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
        this.events.emit('entries-change', { entries: this._entries, changedIds: [...droppedIds, id] });
        this.events.emit('planning-change', this._planningSlots);
        return id;
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

    // ---- Monitoring (live-traffic recalculation) ----

    /**
     * Replace a route entry's data in place (a monitor recalculated it). Bumps `_tick`, updates
     * `data`/`timestamp`, emits `entries-change`, and re-renders the route on its module when shown.
     * The `_tick` guard bails if a newer tick overwrote `data` while `showRoutes` awaited. No-op
     * (returns false) when the entry is unknown. Mirrors `TrafficIncidentsState.replaceEntryData`.
     */
    async replaceRouteData(entryId: string, routes: Routes, sampledAt: number): Promise<boolean> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return false;
        const tick = (entry._tick ?? 0) + 1;
        entry._tick = tick;
        entry.data = routes;
        entry.timestamp = sampledAt;
        this.events.emit('entries-change', { entries: this._entries, changedIds: [entryId] });
        // Re-render only when this entry is currently on the map; the route geometry / traffic
        // delays change each tick, while the waypoints are unchanged (same route).
        if (entry._shown && entry._module) {
            await entry._module.showRoutes(routes);
        }
        return true;
    }

    // Wire a fresh monitor to this entry: each tick recalculates the route and replaces the entry's
    // data; errors surface as monitor-error + monitor-stop. The monitor itself is recalculation-
    // agnostic — the `recalculate` closure (built in the tools layer) captures waypoints + params.
    private _createMonitorForEntry(entry: RoutesEntry): RouteMonitor {
        const monitor = new RouteMonitor();
        monitor.events.on('tick', (snap) => {
            void this.replaceRouteData(entry.id, snap.routes, snap.takenAt);
            this.events.emit('monitor-tick', { entryId: entry.id, snap });
        });
        monitor.events.on('error', (error) => {
            this.events.emit('monitor-error', { entryId: entry.id, error });
            this.events.emit('monitor-stop', { entryId: entry.id, reason: 'error' });
        });
        return monitor;
    }

    /**
     * Arm background recalculation on an entry. Lazy-creates its monitor, then starts polling with
     * the caller-supplied `recalculate` closure. Emits `monitor-start` on the idle → running
     * transition. Throws on unknown id.
     */
    startMonitoring(
        entryId: string,
        deps: RouteMonitorDeps,
        opts?: { intervalMs?: number; skipInitialTick?: boolean },
    ): void {
        const entry = this._requireEntry(entryId);
        const monitor = (entry._monitor ??= this._createMonitorForEntry(entry));
        const wasRunning = monitor.isRunning;
        monitor.start(deps, opts?.intervalMs, opts?.skipInitialTick);
        if (!wasRunning) this.events.emit('monitor-start', { entryId });
    }

    /** Stop recalculating an entry; its last data stays. Emits `monitor-stop`. No-op when not running. */
    stopMonitoring(entryId: string): void {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._monitor) return;
        const wasRunning = entry._monitor.isRunning;
        entry._monitor.stop();
        if (wasRunning) this.events.emit('monitor-stop', { entryId, reason: 'manual' });
    }

    /** True when the entry is currently being recalculated on its interval. */
    isMonitored(entryId: string): boolean {
        return this._entries.find((e) => e.id === entryId)?._monitor?.isRunning ?? false;
    }

    /**
     * Hide every route + waypoint set currently on the map. Map-only — history (`entries`)
     * stays intact. Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        // Clear every entry's module so the map looks empty before the
        // references go away. Layers persist on the style — same trade-off the
        // previous shared-module reset had. Stop any monitors first so no tick
        // fires against a torn-down entry.
        const clearedIds = this._entries.map((entry) => entry.id);
        for (const entry of this._entries) {
            entry._monitor?.stop();
            entry._module?.clearRoutes();
            entry._module?.clearWaypoints();
        }
        this._entries = [];
        this._planningSlots = [];
        this._params = {};
        this._lastShownEntryId = undefined;
        this._mainColor = undefined;
        this.events.emit('entries-change', { entries: this._entries, changedIds: clearedIds });
        this.events.emit('planning-change', this._planningSlots);
        this.events.emit('params-change', this._params);
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
