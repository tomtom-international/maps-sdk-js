/**
 * @module agent-toolkit-state
 */

import type { Routes, WaypointLike } from '@tomtom-org/maps-sdk/core';
import type { RoutingModule } from '@tomtom-org/maps-sdk/map';
import type { BaseEntry } from '../entry';
import type { RouteMonitor } from './monitor/monitor';

/**
 * Route planning parameters stored in routing state.
 * Consumed by setRoute, addWaypointsToRoute, removeWaypointsFromRoute, and replaceWaypointInRoute.
 *
 * @group Agent Toolkit
 *
 * @ignore
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
 *
 * @ignore
 */
export type RoutesEntry = BaseEntry<Routes> & {
    waypoints: WaypointLike[];
    params: RouteParams;
    /**
     * Per-entry RoutingModule. Each entry owns its own module so display state (which route
     * variant is selected, which waypoints are shown, layer theme) lives on the entry instead
     * of a shared slice-level module. Lazy-initialised via RoutingState helpers — undefined
     * until first show.
     */
    _module?: RoutingModule;
    /** True while this entry's `_module` is rendering routes/waypoints on the map. */
    _shown?: boolean;
    /**
     * Per-entry route monitor. Lazy-created on first {@link RoutingState.startMonitoring}; reused
     * across stop/start cycles. Recalculates this route (same waypoints + params) on its interval so
     * the entry stays fresh with live traffic.
     */
    _monitor?: RouteMonitor;
    /**
     * Monotonic counter bumped on every {@link RoutingState.replaceRouteData}. Guards against an
     * out-of-order render: a slow `showRoutes` from an earlier tick that resolves after a newer tick
     * has already overwritten `data` bails before touching the map.
     */
    _tick?: number;
};
