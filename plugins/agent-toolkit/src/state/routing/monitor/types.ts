/**
 * @module agent-toolkit-state
 */

import type { Routes } from '@tomtom-org/maps-sdk/core';

/**
 * A freshly recalculated route from a single monitor tick, with the moment it was sampled.
 * Payload of {@link RoutingStateEvents.monitor-tick}.
 *
 * @group Agent Toolkit
 */
export type RouteSnapshot = {
    takenAt: number;
    routes: Routes;
};

/**
 * Lifecycle state of a per-entry route monitor. `stopped-error` indicates the last recalculation
 * failed and the timer has been cleared — start the monitor again to retry.
 *
 * @group Agent Toolkit
 */
export type RoutePollingStatus = 'idle' | 'running' | 'stopped-error';
