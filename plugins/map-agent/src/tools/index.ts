/**
 * @module map-agent-tools
 */

import type { Tool } from 'ai';
import type { ToolContext } from '../types';
import { createAllToolsFromRegistry, TOOL_REGISTRY } from './tool-registry';

/**
 * The complete set of default map agent tools.
 *
 * @remarks
 * This type defines the structure of the default tool set returned by createMapToolSet().
 * When adding new tools, add them to the TOOL_REGISTRY in tool-registry.ts.
 */
export type DefaultToolSet = {
    [K in keyof typeof TOOL_REGISTRY]: Tool;
};

/**
 * Creates the complete map agent toolset.
 *
 * Exported for advanced customization scenarios. Most users should use
 * {@link createMapAgent} options instead.
 *
 * @param context - Tool execution context containing map and state
 * @returns Record of all available default tools
 *
 * @remarks
 * **When to use this function:**
 * - Wrapping default tools with custom behavior (logging, analytics, etc.)
 * - Building a custom agent without using createMapAgent
 * - Testing individual tools in isolation
 *
 * **Most users don't need this** - use {@link MapAgentOptions} instead:
 * ```typescript
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   tools: {
 *     searchPlaces: myCustomTool,
 *     weatherTool: myWeatherTool
 *   }
 * });
 * ```
 *
 * @example Basic usage with createMapAgent options
 * ```typescript
 * import { createMapAgent, createMapToolSet, createState } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 *
 * const map = new TomTomMap({ ... });
 * const state = createState();
 * const context = { map, state };
 * const defaultTools = createMapToolSet(context);
 *
 * // Use only specific default tools
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   includeDefaultTools: false,
 *   tools: {
 *     myCustomTool: createMyCustomTool(context)
 *   }
 * });
 * ```
 *
 * @example Wrapping default tools with custom behavior
 * ```typescript
 * import { createMapAgent, createMapToolSet, createState } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 *
 * const state = createState();
 * const context = { map, state };
 * const defaultTools = createMapToolSet(context);
 *
 * // Add logging to search tool
 * const loggingSearchTool = {
 *   ...defaultTools.searchPlaces,
 *   execute: async (args) => {
 *     console.log('[Search] Starting:', args);
 *     const startTime = Date.now();
 *
 *     const result = await defaultTools.searchPlaces.execute(args);
 *
 *     console.log(`[Search] Completed in ${Date.now() - startTime}ms`);
 *     return result;
 *   }
 * };
 *
 * const agent = createMapAgent(map, {
 *   model: openai('gpt-4o'),
 *   tools: { searchPlaces: loggingSearchTool }
 * });
 * ```
 *
 * @example Manual agent setup with full control
 * ```typescript
 * import { ToolLoopAgent } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { createMapToolSet, createState, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 *
 * const state = createState();
 * const tools = createMapToolSet({ map, state });
 *
 * // Build agent manually for maximum control
 * const agent = new ToolLoopAgent({
 *   model: openai('gpt-4o'),
 *   tools: {
 *     ...tools,
 *     myCustomTool: createMyCustomTool({ map, state })
 *   },
 *   systemPrompt: BASE_SYSTEM_PROMPT + '\n\nAlways respond in Spanish.',
 *   maxSteps: 15,
 *   onStepFinish: (event) => {
 *     console.log('Step completed:', event);
 *   }
 * });
 * ```
 *
 * @example Testing tools in isolation
 * ```typescript
 * import { describe, it, expect } from 'vitest';
 * import { createMapToolSet, createState, TomTomServiceResponses } from '@tomtom-org/maps-sdk-plugin-ai-agent';
 *
 * describe('Geocode tool', () => {
 *   it('should geocode Amsterdam', async () => {
 *     const mockMap = createMockMap();
 *     const state = createState(mockMap);
 *     const services = new TomTomServiceResponses();
 *     const tools = createMapToolSet({ map: state, services });
 *
     const result = await tools.geocode.execute({ query: 'Amsterdam' });

     expect(services.lastGeocodedResult).toBeDefined();
     expect(services.lastGeocodedResult?.properties.name).toContain('Amsterdam');
   });
 * });
 * ```
 *
 * @see {@link MapAgentOptions.tools}
 * @see {@link createState}
 * @see {@link BASE_SYSTEM_PROMPT}
 */
export function createMapToolSet(context: ToolContext): DefaultToolSet {
    return createAllToolsFromRegistry(context) as DefaultToolSet;
}

export type { ToolCategory, ToolMetadata } from './tool-registry';
// Export tool registry for advanced use cases
export {
    createAllToolsFromRegistry,
    createToolFromRegistry,
    getToolMetadata,
    getToolsByCategory,
    searchToolsInRegistry,
    TOOL_CATEGORIES,
    TOOL_REGISTRY,
} from './tool-registry';
