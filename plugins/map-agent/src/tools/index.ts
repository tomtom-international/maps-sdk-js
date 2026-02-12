/**
 * @module map-agent-tools
 */

import type { ToolContext } from '../types';
import { createCalculateRouteTool } from './calculate-route';
import { createClearMapTool } from './clear-map';
import { createFitBoundsTool } from './fit-bounds';
import { createFlyToTool } from './fly-to';
import { createGeocodeTool } from './geocode';
import { createGetViewportTool } from './get-viewport';
import { createReverseGeocodeTool } from './reverse-geocode';
import { createSearchPlacesTool } from './search-places';
import { createSetLanguageTool } from './set-language';
import { createSetMapStyleTool } from './set-map-style';
import { createShowPlacesTool } from './show-places';
import { createShowRouteTool } from './show-route';
import { createToggleLayersTool } from './toggle-layers';
import { createTogglePOIsTool } from './toggle-pois';
import { createToggleTrafficTool } from './toggle-traffic';

/**
 * Creates the complete map agent toolset.
 *
 * @param context - Tool execution context containing map and state
 * @returns Record of all available tools
 */
export function createMapToolSet(context: ToolContext): Record<string, any> {
    return {
        // Data tools
        geocode: createGeocodeTool(context),
        reverseGeocode: createReverseGeocodeTool(context),
        searchPlaces: createSearchPlacesTool(context),
        calculateRoute: createCalculateRouteTool(context),

        // Map tools
        showPlaces: createShowPlacesTool(context),
        showRoute: createShowRouteTool(context),
        clearMap: createClearMapTool(context),
        flyTo: createFlyToTool(context),
        fitBounds: createFitBoundsTool(context),
        toggleTraffic: createToggleTrafficTool(context),
        togglePOIs: createTogglePOIsTool(context),
        setMapStyle: createSetMapStyleTool(context),
        setLanguage: createSetLanguageTool(context),
        getViewport: createGetViewportTool(context),
        toggleLayers: createToggleLayersTool(context),
    };
}
