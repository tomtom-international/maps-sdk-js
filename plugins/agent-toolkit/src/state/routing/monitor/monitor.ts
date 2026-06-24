import type { Routes } from '@tomtom-org/maps-sdk/core';
import { StateEvents } from '../../events';
import type { RoutePollingStatus, RouteSnapshot } from './types';

/** Default interval between route recalculations (ms). Customizable via {@link RouteMonitor.start}. */
export const ROUTE_MONITOR_INTERVAL_MS = 60_000;

/**
 * Dependency injection for a {@link RouteMonitor}. Production code wires `recalculate` to a closure
 * over `calculateRoute` + the entry's waypoints / params (so each tick re-runs the SAME route);
 * tests pass a deterministic fake and override the timer.
 *
 * The recalculator returns just the routes — the monitor stamps `takenAt` itself so every consumer of
 * one tick (entry data, derived analyses) agrees on the same canonical moment.
 *
 * @group Agent Toolkit
 */
export type RouteMonitorDeps = {
    recalculate: () => Promise<Routes>;
    /** Override for tests. Defaults to the global `setInterval`. */
    setInterval?: (fn: () => void, ms: number) => unknown;
    clearInterval?: (handle: unknown) => void;
};

/**
 * Events fired by {@link RouteMonitor}. The slice subscribes once and re-emits translated copies
 * (`monitor-tick` / `monitor-error`) keyed by entry id.
 */
export type RouteMonitorEvents = {
    /** A recalculation succeeded. Payload: the fresh snapshot. */
    tick: RouteSnapshot;
    /** A recalculation failed — the monitor has cleared its timer and moved to `stopped-error`. */
    error: string;
};

/**
 * One-shot polling loop that recalculates a single route on an interval. Owns its timer, status, and
 * error. Re-starting after `stop()` is allowed and resets all state.
 *
 * The monitor never knows about the entry that owns it — the `recalculate` closure captures the
 * waypoints + params, and the caller decides what to do with each fresh snapshot. Mirrors
 * `IncidentMonitor`; routes carry live traffic, so periodic recalculation keeps the entry fresh.
 *
 * @group Agent Toolkit
 */
export class RouteMonitor {
    readonly events = new StateEvents<RouteMonitorEvents>();

    private _status: RoutePollingStatus = 'idle';
    private _error?: string;
    private _intervalHandle?: unknown;
    private _clearInterval?: (handle: unknown) => void;
    private _recalculate?: RouteMonitorDeps['recalculate'];

    get status(): RoutePollingStatus {
        return this._status;
    }

    get error(): string | undefined {
        return this._error;
    }

    /** True when the monitor is *currently* recalculating on its interval. */
    get isRunning(): boolean {
        return this._status === 'running';
    }

    /** True when the monitor has any activity (running or stopped-error). */
    get isActive(): boolean {
        return this._status !== 'idle';
    }

    /**
     * Begin polling. Captures `deps` for the lifetime of the run, fires the first recalculation
     * immediately (unless `skipInitialTick`), then schedules an interval. No-op when already running.
     *
     * `skipInitialTick` is for a caller that JUST calculated the route and only wants the recurring
     * refresh — an eager first tick would be a redundant duplicate recalculation.
     */
    start(deps: RouteMonitorDeps, intervalMs: number = ROUTE_MONITOR_INTERVAL_MS, skipInitialTick = false): void {
        if (this._status === 'running') return;
        this._status = 'running';
        this._error = undefined;
        // Deps are NOT sticky across stop/start cycles — every restart (incl. recovery from
        // `stopped-error`) reads fresh `recalculate` / timer overrides from the caller.
        this._recalculate = deps.recalculate;
        this._clearInterval =
            deps.clearInterval ?? ((handle: unknown) => clearInterval(handle as ReturnType<typeof setInterval>));
        const setIntervalFn = deps.setInterval ?? setInterval;
        if (!skipInitialTick) void this._tick();
        this._intervalHandle = setIntervalFn(() => void this._tick(), intervalMs);
    }

    /** Stop polling and reset state. No-op when idle. */
    stop(): void {
        if (this._status === 'idle') return;
        this._releaseTimer();
        this._status = 'idle';
        this._error = undefined;
        this._recalculate = undefined;
    }

    // _tick stamps `takenAt` after the recalculation resolves so every downstream consumer
    // (entry data, derived analyses) shares one byte-equal moment.
    private async _tick(): Promise<void> {
        const recalculate = this._recalculate;
        if (!recalculate) return;
        try {
            const routes = await recalculate();
            const snap: RouteSnapshot = { takenAt: Date.now(), routes };
            this.events.emit('tick', snap);
        } catch (err) {
            this._failed(err instanceof Error ? err.message : String(err));
        }
    }

    private _failed(message: string): void {
        this._releaseTimer();
        this._error = message;
        this._status = 'stopped-error';
        this._recalculate = undefined;
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
