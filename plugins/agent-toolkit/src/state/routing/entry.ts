/**
 * @module agent-toolkit-state
 */

import type { Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { RoutingModule } from '@tomtom-org/maps-sdk/map';
import type { RoutesAnalysis } from './analysis';

/**
 * Route planning parameters stored in routing state.
 * Consumed by setRoute, addWaypointsToRoute, removeWaypointsFromRoute, and replaceWaypointInRoute.
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
    /** Accumulated analysis results linked to this entry. */
    _analysis?: RoutesAnalysis[];
    /**
     * Per-entry RoutingModule. Each entry owns its own module so display state (which route
     * variant is selected, which waypoints are shown, layer theme) lives on the entry instead
     * of a shared slice-level module. Lazy-initialised via RoutingState helpers — undefined
     * until first show.
     */
    _module?: RoutingModule;
    /** True while this entry's `_module` is rendering routes/waypoints on the map. */
    _shown?: boolean;
};
