import type { Place, PolygonFeatures, Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { ReachableRangeBudget } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';

/**
 * Common interface for state slices. Implement `reset()` to participate
 * in cleanup when `destroy()` is called on the agent.
 *
 * All built-in state classes implement this. Custom slices can optionally
 * implement it to get automatic cleanup.
 *
 * @group Agent Toolkit
 */
export interface StateSlice {
    reset(): void;
}

/**
 * A single entry in the place search history.
 *
 * @group Agent Toolkit
 */
export type PlacesEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: Place[];
};

/**
 * Route planning parameters stored in routing state.
 * Consumed by setRouteLocations, addStopToRoute, and removeStopFromRoute.
 *
 * @group Agent Toolkit
 */
export type RouteParams = {
    maxAlternatives?: number;
    costModel?: {
        routeType?: string;
        traffic?: 'live' | 'historical';
        avoid?: string[];
        avoidAreas?: Array<number[]>;
    };
    when?: { option: 'departAt' | 'arriveBy'; date: string };
};

/**
 * A single entry in the route calculation history.
 *
 * @group Agent Toolkit
 */
export type RoutesEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: Routes;
    waypoints: WaypointLike[];
    params: RouteParams;
};

/**
 * A single entry in the reachable range history.
 *
 * @group Agent Toolkit
 */
export type RangeEntry = {
    id: string;
    timestamp: number;
    label: string;
    origin: { query?: string; position: Position };
    budgets: ReachableRangeBudget[];
    /** Raw polygon result for use in subsequent geometry searches. Not exposed to the agent. */
    polygon?: PolygonFeatures;
};
