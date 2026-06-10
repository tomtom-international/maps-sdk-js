/**
 * @module agent-toolkit-state
 */

import { type BBox, bboxFromGeoJSON, type TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { type TomTomMap, TrafficIncidentOverlayModule } from '@tomtom-org/maps-sdk/map';
import type { TrafficIncidentDetailsByBBoxParams } from '@tomtom-org/maps-sdk/services';
import type { StateSlice } from '../../types';
import { collapseHistoryToLatest, hideAllEntries, pickUniqueEntryId } from '../entry-helpers';
import { StateEvents } from '../events';
import type { EntryMode } from '../state';
import {
    type DeterministicSpec,
    IncidentsAnalyses,
    type IncidentsAnalysis,
    type IncidentsAnalysisSpec,
} from './analysis';
import { IncidentMonitor, type IncidentMonitorDeps } from './monitor/monitor';
import type { IncidentSnapshot, MonitoredArea } from './monitor/types';

export type { IncidentsAnalysis, IncidentsAnalysisSpec } from './analysis';

/**
 * A single traffic-incidents history entry: the captured query, its incidents, and the
 * per-entry rendering / monitoring / analysis state owned by {@link TrafficIncidentsState}.
 *
 * @group Agent Toolkit
 */
export type TrafficIncidentsEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: TrafficIncident[];
    /**
     * The captured query that produced this entry. Replayed by the monitor on each tick so
     * polling stays in the same slice the entry was loaded with. Reuses the loader's own
     * params shape; the entry stores a resolved {@link BBox} tuple in `bbox` (the loader
     * normalises any GeoJSON value before handing the params off).
     */
    params: TrafficIncidentDetailsByBBoxParams & { bbox: BBox };
    /**
     * Per-entry analysis registry: owns re-executing specs *and* their results.
     * Lazy-created on first {@link TrafficIncidentsState.setAnalysisSpec} or
     * {@link TrafficIncidentsState.addAnalysisToEntry}.
     */
    _analyses?: IncidentsAnalyses;
    /**
     * Per-entry incident-details module. Each entry owns its own module so two areas can be
     * rendered on the map at the same time without sharing a single source. Lazy-initialised
     * via `TrafficIncidentsState.getEntryModule` — undefined until first show. Subscribe to
     * clicks via `module.events.on('click', ...)` once retrieved.
     */
    _module?: TrafficIncidentOverlayModule;
    /** True while this entry is currently rendered on the map. */
    _shown?: boolean;
    /**
     * Focused subset on this entry — the agent's `focusIds` write-side. Drives the dim/highlight
     * affordance on `_module` and feeds `focusedFeatures(entryId)` for stepping through.
     */
    _focus?: { ids: Set<string>; reason?: string };
    /**
     * Per-entry polling loop. Lazy-created on first {@link TrafficIncidentsState.startMonitoring}
     * call; reused across stop/start cycles. Owns timer, status, error, captured area.
     */
    _monitor?: IncidentMonitor;
    /**
     * Monotonic counter incremented on every {@link TrafficIncidentsState.replaceEntryData}
     * call. Used to detect out-of-order ticks: if a slow `module.show()` from an earlier
     * tick resolves after a newer tick has already overwritten `data`, the late path bails
     * before reapplying focus / replaying analyses.
     */
    _tick?: number;
};

/**
 * Snapshot of an entry's focus subset. Returned by `getFocus` / payload on `focus-change`.
 *
 * @group Agent Toolkit
 */
export type IncidentFocus = { ids: Set<string>; reason?: string };

/**
 * Events fired by {@link TrafficIncidentsState}. Subscribe via
 * `state.trafficIncidents.events.on(type, handler)` — returns an unsubscribe function.
 *
 * @group Agent Toolkit
 */
export type TrafficIncidentsStateEvents = {
    /** History changed — entry added, replaced, removed, or cleared via `reset()`. Payload: full entries snapshot. */
    'entries-change': readonly TrafficIncidentsEntry[];
    /** Set of entries currently rendered on the map changed. */
    'shown-change': ReadonlySet<TrafficIncidentsEntry['id']>;
    /**
     * A fresh analysis result landed on an entry. Fires when a spec is first
     * registered, when it is replaced under the same name, AND on every monitor-tick
     * replay — the event is intentionally agnostic about whether the spec is new
     * or recomputed; subscribers re-render off the latest result either way.
     */
    'analysis-change': { entryId: TrafficIncidentsEntry['id']; analysis: IncidentsAnalysis };
    /** Focus subset for an entry changed (or cleared, when `focus === null`). */
    'focus-change': { entryId: TrafficIncidentsEntry['id']; focus: IncidentFocus | null };
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
    /** A monitored entry produced a fresh snapshot (per-tick). */
    'monitor-tick': { entryId: TrafficIncidentsEntry['id']; snap: IncidentSnapshot };
    /** A monitored entry's poll failed — slice has cleared the timer. */
    'monitor-error': { entryId: TrafficIncidentsEntry['id']; error: string };
    /**
     * Polling began on an entry (idle → running). Skipped when `startMonitoring`
     * was a no-op against an already-running monitor.
     */
    'monitor-start': { entryId: TrafficIncidentsEntry['id'] };
    /**
     * Polling halted on an entry. `reason: 'manual'` covers explicit
     * `stopMonitoring` and entry teardown (remove / single-mode trim / reset).
     * `reason: 'error'` fires alongside `monitor-error` — error-only listeners
     * keep using `monitor-error`; lifecycle listeners can rely on this alone.
     */
    'monitor-stop': { entryId: TrafficIncidentsEntry['id']; reason: 'manual' | 'error' };
};

/**
 * State for traffic incidents: entry history and map rendering via per-entry
 * TrafficIncidentOverlayModule. Each entry can be a separate area; under the default
 * `multiple` mode several entries can render at once.
 *
 * Each entry owns its own module (lazy-init on first show) plus an optional per-entry
 * background monitor. Subscribe to changes via `events.on('...')`.
 *
 * @group Agent Toolkit
 */
export class TrafficIncidentsState implements StateSlice {
    private _entries: TrafficIncidentsEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link TrafficIncidentsStateEvents}. */
    readonly events = new StateEvents<TrafficIncidentsStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    get entries(): readonly TrafficIncidentsEntry[] {
        return this._entries;
    }

    /**
     * Display policy: `multiple` (default) keeps every history entry available to render
     * simultaneously; `single` enforces "at most one entry on the map at a time" and trims
     * the history down to the latest entry whenever it's set.
     */
    get entryMode(): EntryMode {
        return this._entryMode;
    }

    /**
     * Switch the display policy. When moving from `multiple` → `single` we hide every entry
     * older than the latest, drop them from history, and emit `entries-change`. No-op when the
     * mode hasn't changed.
     */
    async setEntryMode(mode: EntryMode): Promise<void> {
        if (this._entryMode === mode) return;
        this._entryMode = mode;
        if (mode === 'single' && this._entries.length > 1) {
            this._entries = await collapseHistoryToLatest(this._entries, (entry) => this._teardownEntry(entry), {
                parallel: true,
            });
            this.events.emit('entries-change', this._entries);
            this.events.emit('shown-change', this.shownEntryIds);
        }
        this.events.emit('mode-change', mode);
    }

    /** Set of entries currently rendered on the map. */
    get shownEntryIds(): ReadonlySet<TrafficIncidentsEntry['id']> {
        const out = new Set<TrafficIncidentsEntry['id']>();
        for (const entry of this._entries) if (entry._shown) out.add(entry.id);
        return out;
    }

    /**
     * Append a new entry to the history. Under `single` mode the new entry replaces every
     * older one (and tears their modules + monitors down). `sampledAt` is the moment the
     * data was captured — pass one canonical value per "moment" so future joins (entry
     * data ↔ derived analyses) are byte-equal. Returns the assigned id.
     */
    async addIncidentsEntry(
        data: TrafficIncident[],
        params: TrafficIncidentDetailsByBBoxParams & { bbox: BBox },
        label: string,
        sampledAt: number,
        explicitId?: string,
    ): Promise<string> {
        if (this._entryMode === 'single' && this._entries.length > 0) {
            // `_teardownEntry` tears down a per-entry monitor + module — each instance is
            // independent, so `parallel: true` is race-safe and faster than serial.
            await hideAllEntries(this._entries, (entry) => this._teardownEntry(entry), { parallel: true });
            this._entries = [];
        }
        // Always dedupe — `incidents-${length}` is not collision-free across removes
        // (e.g. add a, add b, remove a → length=1, fallback `incidents-1` collides with surviving `b`).
        const id = pickUniqueEntryId(
            explicitId ?? `incidents-${this._entries.length}`,
            this._entries.map((entry) => entry.id),
        );
        this._entries.push({ id, timestamp: sampledAt, label, data, params });
        this.events.emit('entries-change', this._entries);
        return id;
    }

    /**
     * Replace an entry's data in place and repaint its module without moving the camera.
     * Used by the per-entry monitor tick so incident geometries and any open detail
     * panel stay in sync with the freshest snapshot. `sampledAt` is the canonical moment
     * for this update — propagated to the entry timestamp and to every analysis the
     * registry replays, so all derived data shares one tick. Returns true on success,
     * false when the entry is unknown.
     */
    async replaceEntryData(
        entryId: TrafficIncidentsEntry['id'],
        data: TrafficIncident[],
        sampledAt: number,
    ): Promise<boolean> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return false;
        const tick = (entry._tick ?? 0) + 1;
        entry._tick = tick;
        entry.data = data;
        entry.timestamp = sampledAt;
        this.events.emit('entries-change', this._entries);
        if (entry._module) {
            await entry._module.show({ type: 'FeatureCollection', features: data });
            // A newer tick beat us across the await — its own pass will reconcile
            // focus and replay specs against fresher data, so bail.
            if (entry._tick !== tick) return true;
            if (entry._focus) {
                const present = new Set(data.map((f) => f.properties.id));
                const stillThere = [...entry._focus.ids].filter((id) => present.has(id));
                entry._module.setFocus(stillThere.length > 0 ? stillThere : null);
                if (stillThere.length === 0) {
                    entry._focus = undefined;
                    this.events.emit('focus-change', { entryId: entry.id, focus: null });
                }
            }
        }
        if (entry._tick !== tick) return true;
        await this._rerunRegisteredSpecs(entryId, sampledAt);
        return true;
    }

    /**
     * Lazy-init and return the entry's TrafficIncidentOverlayModule. Consumers subscribe to
     * clicks directly on the returned module via `module.events.on('click', ...)`;
     * Throws on unknown entry id.
     */
    async getEntryModule(entryId: TrafficIncidentsEntry['id']): Promise<TrafficIncidentOverlayModule> {
        const entry = this._requireEntry(entryId);
        entry._module ??= await TrafficIncidentOverlayModule.get(this._ttMap);
        return entry._module;
    }

    /**
     * Render an entry on the map. Lazy-inits its module, pushes the entry's incidents, and
     * (when `fitBounds` is true) fits the camera to the entry's bbox. Emits `shown-change`
     * once the entry transitions to shown.
     */
    async showEntry(entryId: TrafficIncidentsEntry['id'], fitBounds = true): Promise<void> {
        const entry = this._requireEntry(entryId);
        const module = await this.getEntryModule(entryId);
        await module.show({ type: 'FeatureCollection', features: entry.data });
        module.setVisible(true);
        if (fitBounds) {
            this._ttMap.mapLibreMap.fitBounds(entry.params.bbox as [number, number, number, number], {
                padding: 50,
                maxZoom: 14,
            });
        }
        const wasShown = !!entry._shown;
        entry._shown = true;
        if (!wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Hide an entry — clears its module + drops focus. The module reference stays on the
     * entry for cheap re-show. No-op when the entry is unknown or already hidden.
     */
    async hideEntry(entryId: TrafficIncidentsEntry['id']): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._shown) return;
        if (entry._focus) {
            entry._focus = undefined;
            this.events.emit('focus-change', { entryId: entry.id, focus: null });
        }
        entry._module?.setVisible(false);
        await entry._module?.clear();
        entry._shown = false;
        this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Drop an entry from history. Hides it from the map and stops its monitor if any.
     * Emits `entries-change` and, when the entry was shown, `shown-change`. No-op when the
     * id is unknown.
     */
    async removeEntry(entryId: TrafficIncidentsEntry['id']): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return;
        const entry = this._entries[idx];
        const wasShown = !!entry._shown;
        await this._teardownEntry(entry);
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', this._entries);
        if (wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    /**
     * Attach an analysis result to an existing entry. Names are unique within a single
     * entry — adding one with an existing name replaces it. Returns true on success, false
     * if the entry doesn't exist. Lazy-creates the entry's {@link IncidentsAnalyses}.
     */
    addAnalysisToEntry(entryId: TrafficIncidentsEntry['id'], analysis: IncidentsAnalysis): boolean {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return false;
        (entry._analyses ??= new IncidentsAnalyses()).attach(analysis);
        this.events.emit('analysis-change', { entryId: entry.id, analysis });
        // Re-emit entries-change so subscribers re-render — analyses mutate the entry in place.
        this.events.emit('entries-change', this._entries);
        return true;
    }

    /**
     * Register (or replace) a re-executing analysis spec on its source entry. Names are unique
     * per entry — adding one with an existing name replaces it. Lazy-creates the entry's
     * {@link IncidentsAnalyses} on first call.
     */
    setAnalysisSpec(spec: IncidentsAnalysisSpec): void {
        const entry = this._entries.find((e) => e.id === spec.source);
        if (!entry) return;
        (entry._analyses ??= new IncidentsAnalyses()).register(spec);
    }

    /**
     * Register (or replace) a deterministic analysis spec on its source entry — the generic
     * seam personas build typed analyses on (e.g. incident clustering in the traffic example).
     * Names are unique per entry; re-registering under an existing name replaces it.
     * Lazy-creates the entry's {@link IncidentsAnalyses}. With `runNow`, runs the spec once
     * immediately, attaches the result, and **returns it** so the caller uses the freshly
     * computed value directly (no read-back, no cast). Returns `undefined` when the source
     * entry is unknown, `runNow` is not set, or the run threw — so a falsy return is an
     * unambiguous "no fresh result", never a stale one.
     */
    async setDeterministicSpec(spec: DeterministicSpec, opts?: { runNow?: boolean }): Promise<unknown> {
        const entry = this._entries.find((e) => e.id === spec.source);
        if (!entry) return undefined;
        const analyses = (entry._analyses ??= new IncidentsAnalyses());
        analyses.registerDeterministic(spec);
        if (!opts?.runNow) return undefined;
        // Mirror replay's contract: a throwing spec must not propagate a raw exception
        // out of registration. Swallow it, leave the last good result untouched, and
        // return undefined so the caller can tell a fresh run from a stale leftover.
        try {
            const prev = analyses.getResult(spec.name);
            const data = await spec.run(entry.data, {
                previous: prev?.data,
                sampledAt: entry.timestamp,
                previousSampledAt: prev?.timestamp,
            });
            this.addAnalysisToEntry(entry.id, {
                name: spec.name,
                timestamp: entry.timestamp,
                outputFormat: 'json',
                data,
            });
            return data;
        } catch {
            return undefined;
        }
    }

    /** Latest result data for a named analysis on an entry, or undefined when absent. */
    getAnalysisResult(entryId: TrafficIncidentsEntry['id'], name: string): unknown {
        return this._entries.find((e) => e.id === entryId)?._analyses?.getResult(name)?.data;
    }

    /** Remove a spec by name from every entry that carries it. */
    removeAnalysisSpec(name: string): void {
        for (const entry of this._entries) entry._analyses?.unregister(name);
    }

    /** Snapshot of an entry's focus subset, or null when no focus is active or the entry is unknown. */
    getFocus(entryId: TrafficIncidentsEntry['id']): IncidentFocus | null {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._focus) return null;
        return { ids: new Set(entry._focus.ids), reason: entry._focus.reason };
    }

    /**
     * Set the focus subset on a specific entry. Filters ids against the entry's current
     * incidents (drops unknown ones) and pushes the result onto the entry's module.
     * Returns the kept count and any dropped ids.
     */
    setFocus(
        entryId: TrafficIncidentsEntry['id'],
        ids: readonly string[],
        reason?: string,
    ): { focusedCount: number; droppedIds: string[] } {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return { focusedCount: 0, droppedIds: [...ids] };
        if (ids.length === 0) {
            this.clearFocus(entryId);
            return { focusedCount: 0, droppedIds: [] };
        }
        const present = new Set(entry.data.map((f) => f.properties.id as string));
        const keep: string[] = [];
        const dropped: string[] = [];
        for (const id of ids) {
            if (present.has(id)) keep.push(id);
            else dropped.push(id);
        }
        if (keep.length === 0) {
            return { focusedCount: 0, droppedIds: dropped };
        }
        entry._focus = { ids: new Set(keep), reason };
        entry._module?.setFocus(keep);
        this.events.emit('focus-change', { entryId: entry.id, focus: this.getFocus(entryId) });
        return { focusedCount: keep.length, droppedIds: dropped };
    }

    clearFocus(entryId: TrafficIncidentsEntry['id']): void {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._focus) return;
        entry._focus = undefined;
        entry._module?.setFocus(null);
        this.events.emit('focus-change', { entryId: entry.id, focus: null });
    }

    /**
     * The focused incidents in the order passed to {@link setFocus}. Empty when no focus is
     * active on the entry or when the entry is unknown. Used by UI layers that step through
     * the focused subset (prev/next).
     */
    focusedFeatures(entryId: TrafficIncidentsEntry['id']): TrafficIncident[] {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._focus) return [];
        const byId: Record<string, TrafficIncident> = {};
        for (const f of entry.data) {
            const id = f.properties.id;
            if (typeof id === 'string') byId[id] = f;
        }
        const ordered: TrafficIncident[] = [];
        for (const id of entry._focus.ids) {
            const feat = byId[id];
            if (feat) ordered.push(feat);
        }
        return ordered;
    }

    /**
     * Fly the camera to the i-th focused incident on an entry (0-based). Wraps out-of-range
     * indices so callers can pass raw prev/next counters. No-op when the entry has no active
     * focus. Line geometries fitBounds; points flyTo with a sensible zoom.
     */
    navigateFocus(entryId: TrafficIncidentsEntry['id'], index: number): void {
        const features = this.focusedFeatures(entryId);
        if (features.length === 0) return;
        const i = ((index % features.length) + features.length) % features.length;
        const feature = features[i];
        const map = this._ttMap.mapLibreMap;
        if (feature.geometry.type === 'Point') {
            map.flyTo({ center: feature.geometry.coordinates as [number, number], zoom: 15, duration: 600 });
            return;
        }
        const bbox = bboxFromGeoJSON(feature);
        if (!bbox) return;
        map.fitBounds(bbox, { padding: 120, maxZoom: 16, duration: 600 });
    }

    /**
     * Walk entries newest-first to find which one currently holds an incident with this id.
     * Useful for UI layers that hold an incident id without remembering which entry produced it.
     */
    findEntryWithIncident(incidentId: string): TrafficIncidentsEntry | undefined {
        for (let i = this._entries.length - 1; i >= 0; i--) {
            const entry = this._entries[i];
            if (entry.data.some((f) => f.properties.id === incidentId)) return entry;
        }
        return undefined;
    }

    // ---- Per-entry monitoring ----

    /**
     * Start polling for an entry. Lazy-creates an {@link IncidentMonitor}, wires its events
     * once, then delegates to {@link IncidentMonitor.start}. No-op when polling is already
     * running. Throws on unknown entry id.
     */
    startMonitoring(
        entryId: TrafficIncidentsEntry['id'],
        area: MonitoredArea,
        deps: IncidentMonitorDeps,
        opts?: { intervalMs?: number },
    ): void {
        const entry = this._requireEntry(entryId);
        const monitor = (entry._monitor ??= this._createMonitorForEntry(entry));
        // Capture the pre-start state so we fire `monitor-start` on every transition
        // *into* running — that includes recovery from `stopped-error`, not just from
        // idle. `monitor.start` is itself idempotent on running.
        const wasRunning = monitor.isRunning;
        monitor.start(area, deps, opts?.intervalMs);
        if (!wasRunning) this.events.emit('monitor-start', { entryId });
    }

    /** Stop polling. No-op when idle or unknown. */
    stopMonitoring(entryId: TrafficIncidentsEntry['id']): void {
        const monitor = this._entries.find((e) => e.id === entryId)?._monitor;
        if (!monitor?.isActive) return;
        monitor.stop();
        this.events.emit('monitor-stop', { entryId, reason: 'manual' });
    }

    /**
     * True when the entry is *currently* being polled. A monitor stuck in
     * `stopped-error` returns false here so the start tool can report a truthful
     * `alreadyRunning` and a fresh `start` call actually re-arms the timer
     * instead of silently being treated as a no-op.
     */
    isMonitored(entryId: TrafficIncidentsEntry['id']): boolean {
        return this._entries.find((e) => e.id === entryId)?._monitor?.isRunning ?? false;
    }

    private _createMonitorForEntry(entry: TrafficIncidentsEntry): IncidentMonitor {
        const monitor = new IncidentMonitor(entry.params.bbox);
        monitor.events.on('tick', (snap) => {
            void this.replaceEntryData(entry.id, snap.incidents, snap.takenAt);
            this.events.emit('monitor-tick', { entryId: entry.id, snap });
        });
        monitor.events.on('error', (error) => {
            this.events.emit('monitor-error', { entryId: entry.id, error });
            this.events.emit('monitor-stop', { entryId: entry.id, reason: 'error' });
        });
        return monitor;
    }

    // ---- Internal helpers ----

    private _requireEntry(entryId: TrafficIncidentsEntry['id']): TrafficIncidentsEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`TrafficIncidentsState: unknown entry "${entryId}"`);
        return entry;
    }

    // Replay all analysis specs registered on this entry. The registry stores each fresh
    // result internally; the slice's job is to surface the events so external subscribers
    // re-render. `sampledAt` propagates from the caller's tick so every fresh analysis
    // shares the entry's new timestamp.
    private async _rerunRegisteredSpecs(entryId: TrafficIncidentsEntry['id'], sampledAt: number): Promise<void> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry?._analyses?.specs.length) return;
        const fresh = await entry._analyses.replay(entry.data, sampledAt);
        for (const analysis of fresh) this.events.emit('analysis-change', { entryId: entry.id, analysis });
        if (fresh.length > 0) this.events.emit('entries-change', this._entries);
    }

    // Tear an entry down: stop its monitor and clear its module. Idempotent.
    // Used by removeEntry, single-mode trimming, and reset.
    //
    // Synchronous emits run before any await so callers that fire-and-forget
    // (notably `reset`, which calls `events.clear()` right after) still see them.
    private async _teardownEntry(entry: TrafficIncidentsEntry): Promise<void> {
        this.stopMonitoring(entry.id);
        if (entry._focus) {
            entry._focus = undefined;
            this.events.emit('focus-change', { entryId: entry.id, focus: null });
        }
        if (entry._shown) entry._shown = false;
        if (entry._module) {
            entry._module.setVisible(false);
            await entry._module.clear();
        }
        entry._module = undefined;
    }

    /**
     * Hide every traffic-incidents entry currently on the map. Map-only — history is kept.
     * Implements {@link ClearableMapSlice}.
     */
    async clearShown(): Promise<void> {
        for (const id of this.shownEntryIds) await this.hideEntry(id);
    }

    reset(): void {
        // Tear every entry down synchronously where we can — the awaits inside _teardownEntry
        // are just module.clear()s; we run them concurrently and don't block reset() itself.
        for (const entry of this._entries) void this._teardownEntry(entry);
        const hadEntries = this._entries.length > 0;
        this._entries = [];
        if (hadEntries) {
            this.events.emit('entries-change', this._entries);
            this.events.emit('shown-change', this.shownEntryIds);
        }
        this.events.clear();
    }
}
