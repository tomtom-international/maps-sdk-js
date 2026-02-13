/**
 * @module map-agent-state
 */

import type { MapAgentState } from './types';

/**
 * Creates a new empty agent state.
 */
export function createState(): MapAgentState {
    return {
        searchResultsHistory: [],
        routesHistory: [],
        modules: {},
    };
}

/**
 * Resets the agent state, clearing all cached data and modules.
 */
export function resetState(state: MapAgentState): void {
    // Clear data
    state.searchResultsHistory = [];
    state.routesHistory = [];
    delete state.lastWaypoints;
    delete state.lastGeocodeResult;

    // Clear module references
    state.modules = {};
}
