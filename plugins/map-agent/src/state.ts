/**
 * @module map-agent-state
 */

import type { MapAgentState } from './types';

/**
 * Creates a new empty agent state.
 *
 * Exported for advanced scenarios where you're building tools manually.
 * **Most users don't need this** - {@link createMapAgent} handles state creation automatically.
 *
 * @returns A new empty MapAgentState instance
 *
 * @remarks
 * Use this when:
 * - Building custom agents with {@link createMapToolSet} without using createMapAgent
 * - Setting up test fixtures for tool testing
 * - Creating multiple independent agent instances with separate state
 *
 * @example Basic usage with createMapToolSet
 * ```typescript
 * import { createState, createMapToolSet } from '@tomtom-org/maps-sdk-map-agent';
 *
 * const state = createState();
 * const context = { map, state };
 * const tools = createMapToolSet(context);
 *
 * // Use tools directly
 * await tools.geocode.execute({ query: 'Amsterdam' });
 * console.log(state.lastGeocodeResult);
 * ```
 *
 * @example Setting up test fixtures
 * ```typescript
 * import { describe, it, beforeEach } from 'vitest';
 * import { createState, createMapToolSet } from '@tomtom-org/maps-sdk-map-agent';
 *
 * describe('Map tools', () => {
 *   let state, tools;
 *
 *   beforeEach(() => {
 *     state = createState();
 *     tools = createMapToolSet({ map: mockMap, state });
 *   });
 *
 *   it('should accumulate search results', async () => {
 *     await tools.searchPlaces.execute({ query: 'coffee' });
 *     await tools.searchPlaces.execute({ query: 'restaurants' });
 *
 *     expect(state.searchResultsHistory).toHaveLength(2);
 *   });
 * });
 * ```
 *
 * @example Multiple independent agents
 * ```typescript
 * import { createState, createMapToolSet, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-map-agent';
 * import { ToolLoopAgent } from 'ai';
 *
 * // Agent 1: Search specialist
 * const searchState = createState();
 * const searchTools = createMapToolSet({ map, state: searchState });
 * const searchAgent = new ToolLoopAgent({
 *   model: openai('gpt-4o'),
 *   tools: { searchPlaces: searchTools.searchPlaces, showPlaces: searchTools.showPlaces },
 *   systemPrompt: 'You are a search specialist...'
 * });
 *
 * // Agent 2: Routing specialist
 * const routeState = createState();
 * const routeTools = createMapToolSet({ map, state: routeState });
 * const routeAgent = new ToolLoopAgent({
 *   model: openai('gpt-4o'),
 *   tools: { calculateRoute: routeTools.calculateRoute, showRoute: routeTools.showRoute },
 *   systemPrompt: 'You are a routing specialist...'
 * });
 * ```
 *
 * @see {@link createMapToolSet}
 * @see {@link MapAgentState}
 * @see {@link resetState}
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
