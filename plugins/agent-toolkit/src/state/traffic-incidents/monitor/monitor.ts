import type { BBox, TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { StateEvents } from '../../events';
import type { IncidentSnapshot, MonitoredArea, PollingStatus } from './types';

/** Default interval between polling ticks (ms). Customizable via {@link IncidentMonitor.start}. */
export const INCIDENT_MONITOR_INTERVAL_MS = 60_000;

/**
 * Dependency injection for an {@link IncidentMonitor}. Production code wires
 * `fetchIncidents` to `trafficIncidentDetails`; tests can pass a deterministic fake
 * and override the timer.
 *
 * The fetcher returns just the incidents — the monitor stamps `takenAt` itself
 * so every consumer of one tick (entry data, derived analyses, sandbox `now`)
 * agrees on the same canonical moment.
 *
 * @group Agent Toolkit
 */
export type IncidentMonitorDeps = {
    fetchIncidents: (bbox: BBox) => Promise<TrafficIncident[]>;
    /** Override for tests. Defaults to the global `setInterval`. */
    setInterval?: (fn: () => void, ms: number) => unknown;
    clearInterval?: (handle: unknown) => void;
};

/**
 * Events fired by {@link IncidentMonitor}. The slice subscribes once and re-emits
 * translated copies (`monitor-tick` / `monitor-error`) keyed by entry id.
 */
export type IncidentMonitorEvents = {
    /** A poll succeeded. Payload: the fresh snapshot. */
    tick: IncidentSnapshot;
    /** A poll failed — the monitor has cleared its timer and moved to `stopped-error`. */
    error: string;
};

/**
 * One-shot polling loop scoped to a single bbox. Owns its timer, status, error,
 * and captured area. Re-starting after `stop()` is allowed and resets all state.
 *
 * The monitor never knows about the entry that owns it — it surfaces ticks/errors
 * through `events`, and the caller decides what to do with the snapshot.
 *
 * @group Agent Toolkit
 */
export class IncidentMonitor {
    readonly events = new StateEvents<IncidentMonitorEvents>();

    private _status: PollingStatus = 'idle';
    private _area?: MonitoredArea;
    private _error?: string;
    private _intervalHandle?: unknown;
    private _clearInterval?: (handle: unknown) => void;
    private _fetchIncidents?: IncidentMonitorDeps['fetchIncidents'];

    constructor(private readonly _bbox: BBox) {}

    get status(): PollingStatus {
        return this._status;
    }

    get monitoredArea(): MonitoredArea | undefined {
        return this._area;
    }

    get error(): string | undefined {
        return this._error;
    }

    /**
     * True when the monitor is *currently* polling. Distinct from {@link isActive},
     * which also covers `stopped-error` — a state where the timer is gone but the
     * monitor still carries an unacknowledged error. Use this for "is the entry
     * being polled right now"; use `isActive` for "is there anything to clean up".
     */
    get isRunning(): boolean {
        return this._status === 'running';
    }

    /** True when the monitor has any polling activity (running or stopped-error). */
    get isActive(): boolean {
        return this._status !== 'idle';
    }

    /**
     * Begin polling. Captures `deps` for the lifetime of the run, fires the first tick
     * immediately, then schedules an interval. No-op when already running.
     */
    start(area: MonitoredArea, deps: IncidentMonitorDeps, intervalMs: number = INCIDENT_MONITOR_INTERVAL_MS): void {
        if (this._status === 'running') return;
        this._status = 'running';
        this._error = undefined;
        this._area = area;
        // Deps are NOT sticky across stop/start cycles — every restart (incl. recovery
        // from `stopped-error`) reads fresh `fetchIncidents` / timer overrides from the
        // caller. Tests that swap fakes between cycles rely on this.
        this._fetchIncidents = deps.fetchIncidents;
        this._clearInterval =
            deps.clearInterval ?? ((handle: unknown) => clearInterval(handle as ReturnType<typeof setInterval>));
        const setIntervalFn = deps.setInterval ?? setInterval;
        // Eager first tick — consumers shouldn't wait an interval for the initial snapshot.
        void this._tick();
        this._intervalHandle = setIntervalFn(() => void this._tick(), intervalMs);
    }

    /** Stop polling and reset state. No-op when idle. */
    stop(): void {
        if (this._status === 'idle') return;
        this._releaseTimer();
        this._status = 'idle';
        this._error = undefined;
        this._area = undefined;
        this._fetchIncidents = undefined;
    }

    // _tick is the canonical timestamp authority for one polling cycle. It stamps
    // `takenAt` after the fetch resolves so every downstream consumer (entry data,
    // derived analyses, sandbox `now`) shares one byte-equal moment.
    private async _tick(): Promise<void> {
        const fetchIncidents = this._fetchIncidents;
        if (!fetchIncidents) return;
        try {
            const incidents = await fetchIncidents(this._bbox);
            const snap: IncidentSnapshot = { takenAt: Date.now(), incidents };
            this.events.emit('tick', snap);
        } catch (err) {
            this._failed(err instanceof Error ? err.message : String(err));
        }
    }

    private _failed(message: string): void {
        this._releaseTimer();
        this._error = message;
        this._status = 'stopped-error';
        this._fetchIncidents = undefined;
        this.events.emit('error', message);
    }

    private _releaseTimer(): void {
        if (this._intervalHandle != null) {
            this._clearInterval?.(this._intervalHandle);
            this._intervalHandle = undefined;
        }
        this._clearInterval = undefined;
    }
}
