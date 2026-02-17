/**
 * @module map-agent-state
 */

import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { TomTomMapWithModules } from './types';

TomTomConfig.instance.put({ language: 'en-GB' });

/**
 * Creates a new empty agent state.
 *
 * Exported for advanced scenarios where you're building tools manually.
 * **Most users don't need this** - {@link createMapAgent} handles state creation automatically.
 *
 * @param map - The TomTomMap instance that the state will manage modules for
 * @returns A new empty TomTomMapWithModules instance
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
 * const state = createState(map);
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
 *     state = createState(mockMap);
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
 * const searchState = createState(map);
 * const searchTools = createMapToolSet({ map, state: searchState });
 * const searchAgent = new ToolLoopAgent({
 *   model: openai('gpt-4o'),
 *   tools: { searchPlaces: searchTools.searchPlaces, showPlaces: searchTools.showPlaces },
 *   systemPrompt: 'You are a search specialist...'
 * });
 *
 * // Agent 2: Routing specialist
 * const routeState = createState(map);
 * const routeTools = createMapToolSet({ map, state: routeState });
 * const routeAgent = new ToolLoopAgent({
 *   model: openai('gpt-4o'),
 *   tools: { calculateRoute: routeTools.calculateRoute, showRoute: routeTools.showRoute },
 *   systemPrompt: 'You are a routing specialist...'
 * });
 * ```
 *
 * @see {@link createMapToolSet}
 * @see {@link TomTomMapWithModules}
 * @see {@link resetState}
 */
export function createState(map: TomTomMap): TomTomMapWithModules {
    return new TomTomMapWithModules(map);
}

/**
 * Resets the agent state, clearing all cached data and modules.
 *
 * @deprecated Use `state.reset()` method instead
 */
export function resetState(state: TomTomMapWithModules): void {
    state.reset();
}
