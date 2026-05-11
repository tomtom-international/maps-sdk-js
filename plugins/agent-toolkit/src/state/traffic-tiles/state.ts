/**
 * @module agent-toolkit-state
 */

import { type TomTomMap, TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import type { StateSlice } from '../../types';

/**
 * State for traffic tile overlays — flow tiles and incident overlay tiles. These are
 * raster/tile layers that the user toggles on top of the base map; result caching and
 * per-result rendering for incident *features* lives in {@link TrafficIncidentsState},
 * and analytics aggregations in {@link TrafficAreaAnalyticsState}.
 *
 * @group Agent Toolkit
 */
export class TrafficTilesState implements StateSlice {
    private _trafficFlowModule?: TrafficFlowModule;
    private _trafficIncidentsModule?: TrafficIncidentsModule;

    constructor(private readonly _ttMap: TomTomMap) {}

    // Module getters (lazy initialization)

    async getTrafficFlowModule(): Promise<TrafficFlowModule> {
        this._trafficFlowModule ??= await TrafficFlowModule.get(this._ttMap);
        return this._trafficFlowModule;
    }

    async getTrafficIncidentsModule(): Promise<TrafficIncidentsModule> {
        this._trafficIncidentsModule ??= await TrafficIncidentsModule.get(this._ttMap);
        return this._trafficIncidentsModule;
    }

    // Cached module access (for reading without triggering initialization)

    get trafficFlowModule(): TrafficFlowModule | undefined {
        return this._trafficFlowModule;
    }

    get trafficIncidentsModule(): TrafficIncidentsModule | undefined {
        return this._trafficIncidentsModule;
    }

    reset(): void {
        this._trafficFlowModule = undefined;
        this._trafficIncidentsModule = undefined;
    }
}
