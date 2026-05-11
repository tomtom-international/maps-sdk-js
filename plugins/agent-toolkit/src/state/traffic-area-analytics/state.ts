/**
 * @module agent-toolkit-state
 */

import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { type TomTomMap, type TrafficAreaAnalyticsConfig, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import type { StateSlice } from '../../types';
import { StateEvents } from '../events';

/**
 * Events fired by {@link TrafficAreaAnalyticsState}. Subscribe via
 * `state.trafficAreaAnalytics.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type TrafficAreaAnalyticsStateEvents = {
    /** Last fetched analytics result and its module are now active on the map. */
    'analytics-shown': { analytics: TrafficAreaAnalytics; module: TrafficAreaAnalyticsModule };
    /** The active analytics visualization was cleared or replaced. */
    'analytics-cleared': void;
    /** Module-level visualization config changed (mode, metric, scaleMode, ...). */
    'config-change': TrafficAreaAnalyticsConfig | undefined;
};

/**
 * State for traffic area analytics — the lazy-init module, the last fetched
 * aggregation result, and its currently-applied visualization config. Tile
 * overlays (flow + incidents) live in {@link TrafficTilesState}.
 *
 * @group Agent Toolkit
 */
export class TrafficAreaAnalyticsState implements StateSlice {
    private _trafficAreaAnalyticsModule?: TrafficAreaAnalyticsModule;
    private _lastAreaAnalytics?: TrafficAreaAnalytics;
    private _currentAnalyticsConfig?: TrafficAreaAnalyticsConfig;
    private _configChangeUnsub?: () => void;

    /** Subscribe to state changes — see {@link TrafficAreaAnalyticsStateEvents}. */
    readonly events = new StateEvents<TrafficAreaAnalyticsStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    // Module getter (lazy initialization)

    async getTrafficAreaAnalyticsModule(): Promise<TrafficAreaAnalyticsModule> {
        if (!this._trafficAreaAnalyticsModule) {
            this._trafficAreaAnalyticsModule = await TrafficAreaAnalyticsModule.get(this._ttMap);
            // Wire config change events so agent state stays in sync with module
            this._configChangeUnsub = this._trafficAreaAnalyticsModule.events.on('config-change', (config) => {
                this._currentAnalyticsConfig = config;
                this.events.emit('config-change', config);
            });
        }
        return this._trafficAreaAnalyticsModule;
    }

    // Cached module access (for reading without triggering initialization)

    get trafficAreaAnalyticsModule(): TrafficAreaAnalyticsModule | undefined {
        return this._trafficAreaAnalyticsModule;
    }

    // Area analytics result caching

    get lastAreaAnalytics(): TrafficAreaAnalytics | undefined {
        return this._lastAreaAnalytics;
    }

    setLastAreaAnalytics(result: TrafficAreaAnalytics): void {
        this._lastAreaAnalytics = result;
    }

    /** Current visualization config, updated by module configChange events. */
    get currentAnalyticsConfig(): TrafficAreaAnalyticsConfig | undefined {
        return this._currentAnalyticsConfig;
    }

    /**
     * Notify subscribers that an analytics result is now active on the map. Called from
     * tool implementations after `module.show(...)` succeeds.
     */
    notifyAnalyticsShown(analytics: TrafficAreaAnalytics, module: TrafficAreaAnalyticsModule): void {
        this.events.emit('analytics-shown', { analytics, module });
    }

    /** Notify subscribers that the active analytics visualization was cleared. */
    notifyAnalyticsCleared(): void {
        this.events.emit('analytics-cleared', undefined);
    }

    reset(): void {
        this._configChangeUnsub?.();
        this.notifyAnalyticsCleared();
        this._trafficAreaAnalyticsModule = undefined;
        this._lastAreaAnalytics = undefined;
        this._currentAnalyticsConfig = undefined;
        this._configChangeUnsub = undefined;
    }
}
