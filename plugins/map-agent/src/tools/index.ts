/**
 * @module map-agent-tools
 */

import type { ToolContext } from '../types';

// MapLibre tools - MapLibre-specific features
import { createGetStyleDetailsTool } from './maplibre/get-style-details';
import { createSetLayoutPropertyTool } from './maplibre/set-layout-property';
import { createSetPaintPropertyTool } from './maplibre/set-paint-property';

// Service tools - SDK services without map display
import { createCalculateRouteTool } from './services/calculate-route';
import { createGeocodeTool } from './services/geocode';
import { createReverseGeocodeTool } from './services/reverse-geocode';
import { createSearchPlacesTool } from './services/search-places';

// TomTom Map tools - map display operations
import { createClearMapTool } from './tomtom-map/clear-map';
import { createFitBoundsTool } from './tomtom-map/fit-bounds';
import { createFlyToTool } from './tomtom-map/fly-to';
import { createGetViewportTool } from './tomtom-map/get-viewport';
import { createSetLanguageTool } from './tomtom-map/set-language';
import { createSetMapStyleTool } from './tomtom-map/set-map-style';
import { createShowPlacesTool } from './tomtom-map/show-places';
import { createShowRouteTool } from './tomtom-map/show-route';
import { createToggleLayersTool } from './tomtom-map/toggle-layers';
import { createTogglePOIsTool } from './tomtom-map/toggle-pois';
import { createToggleTrafficFlowTool, createToggleTrafficIncidentsTool } from './tomtom-map/toggle-traffic';

// Utility tools - pure functions that calculate values
import { createFormatDistanceTool } from './utilities/format-distance';
import { createFormatDurationTool } from './utilities/format-duration';

/**
 * The complete set of default map agent tools.
 *
 * @remarks
 * This type defines the structure of the default tool set returned by createMapToolSet().
 * When adding new tools, add them here to automatically update DefaultToolName.
 */
export interface DefaultToolSet {
    // Service tools - SDK services without map display
    geocode: ReturnType<typeof createGeocodeTool>;
    reverseGeocode: ReturnType<typeof createReverseGeocodeTool>;
    searchPlaces: ReturnType<typeof createSearchPlacesTool>;
    calculateRoute: ReturnType<typeof createCalculateRouteTool>;

    // Utility tools - pure functions that calculate values
    formatDistance: ReturnType<typeof createFormatDistanceTool>;
    formatDuration: ReturnType<typeof createFormatDurationTool>;

    // TomTom Map tools - map display operations
    showPlaces: ReturnType<typeof createShowPlacesTool>;
    showRoute: ReturnType<typeof createShowRouteTool>;
    clearMap: ReturnType<typeof createClearMapTool>;
    flyTo: ReturnType<typeof createFlyToTool>;
    fitBounds: ReturnType<typeof createFitBoundsTool>;
    toggleTrafficFlow: ReturnType<typeof createToggleTrafficFlowTool>;
    toggleTrafficIncidents: ReturnType<typeof createToggleTrafficIncidentsTool>;
    togglePOIs: ReturnType<typeof createTogglePOIsTool>;
    setMapStyle: ReturnType<typeof createSetMapStyleTool>;
    setLanguage: ReturnType<typeof createSetLanguageTool>;
    getViewport: ReturnType<typeof createGetViewportTool>;
    toggleLayers: ReturnType<typeof createToggleLayersTool>;

    // MapLibre tools - MapLibre-specific features
    getStyleDetails: ReturnType<typeof createGetStyleDetailsTool>;
    setLayoutProperty: ReturnType<typeof createSetLayoutPropertyTool>;
    setPaintProperty: ReturnType<typeof createSetPaintPropertyTool>;
}

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
 *   overrideTools: { searchPlaces: myCustomTool },
 *   customTools: { weatherTool: myWeatherTool }
 * });
 * ```
 *
 * @example Basic usage with createMapAgent options
 * ```typescript
 * import { createMapAgent, createMapToolSet, createState } from '@tomtom-org/maps-sdk-ai-agent';
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
 *   customTools: {
 *     geocode: defaultTools.geocode,
 *     searchPlaces: defaultTools.searchPlaces,
 *     myCustomTool: createMyCustomTool(context)
 *   }
 * });
 * ```
 *
 * @example Wrapping default tools with custom behavior
 * ```typescript
 * import { createMapAgent, createMapToolSet, createState } from '@tomtom-org/maps-sdk-ai-agent';
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
 *   overrideTools: { searchPlaces: loggingSearchTool }
 * });
 * ```
 *
 * @example Manual agent setup with full control
 * ```typescript
 * import { ToolLoopAgent } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { createMapToolSet, createState, BASE_SYSTEM_PROMPT } from '@tomtom-org/maps-sdk-ai-agent';
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
 * import { createMapToolSet, createState } from '@tomtom-org/maps-sdk-ai-agent';
 *
 * describe('Geocode tool', () => {
 *   it('should geocode Amsterdam', async () => {
 *     const mockMap = createMockMap();
 *     const state = createState();
 *     const tools = createMapToolSet({ map: mockMap, state });
 *
 *     const result = await tools.geocode.execute({ query: 'Amsterdam' });
 *
 *     expect(state.lastGeocodeResult).toBeDefined();
 *     expect(state.lastGeocodeResult?.properties.name).toContain('Amsterdam');
 *   });
 * });
 * ```
 *
 * @see {@link MapAgentOptions.overrideTools}
 * @see {@link MapAgentOptions.customTools}
 * @see {@link MapAgentOptions.includeDefaultTools}
 * @see {@link createState}
 * @see {@link BASE_SYSTEM_PROMPT}
 */
export function createMapToolSet(context: ToolContext): DefaultToolSet {
    return {
        // Service tools - SDK services without map display
        geocode: createGeocodeTool(context),
        reverseGeocode: createReverseGeocodeTool(context),
        searchPlaces: createSearchPlacesTool(context),
        calculateRoute: createCalculateRouteTool(context),

        // Utility tools - pure functions that calculate values
        formatDistance: createFormatDistanceTool(context),
        formatDuration: createFormatDurationTool(context),

        // TomTom Map tools - map display operations
        showPlaces: createShowPlacesTool(context),
        showRoute: createShowRouteTool(context),
        clearMap: createClearMapTool(context),
        flyTo: createFlyToTool(context),
        fitBounds: createFitBoundsTool(context),
        toggleTrafficFlow: createToggleTrafficFlowTool(context),
        toggleTrafficIncidents: createToggleTrafficIncidentsTool(context),
        togglePOIs: createTogglePOIsTool(context),
        setMapStyle: createSetMapStyleTool(context),
        setLanguage: createSetLanguageTool(context),
        getViewport: createGetViewportTool(context),
        toggleLayers: createToggleLayersTool(context),

        // MapLibre tools - MapLibre-specific features
        getStyleDetails: createGetStyleDetailsTool(context),
        setLayoutProperty: createSetLayoutPropertyTool(context),
        setPaintProperty: createSetPaintPropertyTool(context),
    };
}
