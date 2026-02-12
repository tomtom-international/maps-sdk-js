/**
 * @module map-agent-state
 */

import type { MapAgentState } from './types';

/**
 * Creates a new empty agent state.
 */
export function createState(): MapAgentState {
    return {
        modules: {},
    };
}

/**
 * Resets the agent state, clearing all cached data and modules.
 */
export function resetState(state: MapAgentState): void {
    // Clear data
    delete state.lastSearchResults;
    delete state.lastRoutes;
    delete state.lastWaypoints;
    delete state.lastGeocodeResult;

    // Clear module references
    state.modules = {};
}
