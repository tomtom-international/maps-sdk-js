/**
 * @module map-agent-tools
 */

import type { Tool } from 'ai';
import type { ToolContext } from '../types';
import { extractParametersFromSchema } from './extract-schema-params';
import {
    createGetStyleDetailsTool,
    createSetLayoutPropertyTool,
    createSetPaintPropertyTool,
    getStyleSchema,
    setLayoutPropertySchema,
    setPaintPropertySchema,
} from './maplibre';
import { createSearchToolsTool, searchToolsSchema } from './meta';
// Import all tool factory functions and schemas
import {
    addStopToRouteSchema,
    calculateRouteSchema,
    createAddStopToRouteTool,
    createCalculateRouteTool,
    createGeocodeTool,
    createGetLastGeocodedResultTool,
    createGetLastPlacesTool,
    createGetLastReverseGeocodedResultTool,
    createGetLastRoutesTool,
    createGetLastSearchResultsTool,
    createRemoveStopFromRouteTool,
    createReverseGeocodeTool,
    createSearchPlacesTool,
    geocodeSchema,
    getLastGeocodedResultSchema,
    getLastPlacesSchema,
    getLastReverseGeocodedResultSchema,
    getLastRoutesSchema,
    getLastSearchResultsSchema,
    removeStopFromRouteSchema,
    reverseGeocodeSchema,
    searchPlacesSchema,
} from './services';
import {
    clearMapSchema,
    createClearMapTool,
    createFitBoundsTool,
    createFitRouteSectionTool,
    createFlyToTool,
    createGetShownPlacesTool,
    createGetShownRoutesTool,
    createGetShownRouteTrafficIncidentsTool,
    createGetShownWaypointsTool,
    createGetStandardMapStylesTool,
    createGetViewportTool,
    createSetLanguageTool,
    createSetMapStyleTool,
    createShowPlacesTool,
    createShowRouteTool,
    createToggleLayersTool,
    createTogglePOIsTool,
    createToggleTrafficFlowTool,
    createToggleTrafficIncidentsTool,
    fitBoundsSchema,
    fitRouteSectionSchema,
    flyToSchema,
    getShownPlacesSchema,
    getShownRoutesSchema,
    getShownRouteTrafficIncidentsSchema,
    getShownWaypointsSchema,
    getStandardMapStylesSchema,
    getViewportSchema,
    setLanguageSchema,
    setMapStyleSchema,
    showPlacesSchema,
    showRouteSchema,
    toggleLayersSchema,
    togglePOIsSchema,
    toggleTrafficFlowSchema,
    toggleTrafficIncidentsSchema,
} from './tomtom-map';
import {
    createFormatDistanceTool,
    createFormatDurationTool,
    formatDistanceSchema,
    formatDurationSchema,
} from './utilities';

/**
 * Tool category for organizing tools by functionality.
 */
export type ToolCategory = 'location-services' | 'map-display' | 'map-appearance' | 'advanced' | 'utilities' | 'meta';

/**
 * Tool categories configuration with descriptions.
 * Used by the searchTools meta-tool to provide category information.
 */
export const TOOL_CATEGORIES = {
    'location-services': {
        description: 'Find places, geocode addresses, calculate routes',
    },
    'map-display': {
        description: 'Display data on the map, control camera, manage viewport',
    },
    'map-appearance': {
        description: 'Control map style, language, layers, traffic, POIs',
    },
    advanced: {
        description: 'Advanced MapLibre style manipulation',
    },
    utilities: {
        description: 'Format distances, durations, and other utilities',
    },
    meta: {
        description: 'Tools for discovering other tools',
    },
} as const satisfies Record<ToolCategory, { description: string }>;

/**
 * Metadata for a single tool in the registry.
 */
export type ToolMetadata = {
    name: string;
    category: ToolCategory;
    description: string;
    shortDescription: string;
    tags: string[];
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    examples: string[];
    relatedTools?: string[];
    /** Factory function to create the tool instance */
    create: (context: ToolContext) => Tool;
};

/**
 * Complete tool registry with metadata and factory functions for all available tools.
 */
export const TOOL_REGISTRY: Record<string, ToolMetadata> = {
    searchTools: {
        name: 'searchTools',
        category: 'meta',
        shortDescription: 'Search and discover available tools',
        description: 'Search for available tools by keyword or category to discover capabilities',
        tags: ['search', 'discover', 'find', 'help', 'tools', 'capabilities'],
        parameters: extractParametersFromSchema(searchToolsSchema),
        examples: ['searchTools()', 'searchTools(query: "route")', 'searchTools(category: "map-display")'],
        relatedTools: [],
        create: createSearchToolsTool,
    },
    geocode: {
        name: 'geocode',
        category: 'location-services',
        shortDescription: 'Convert address to coordinates',
        description: 'Convert an address or place name to geographic coordinates',
        tags: ['address', 'coordinates', 'location', 'convert', 'find'],
        parameters: extractParametersFromSchema(geocodeSchema),
        examples: ['geocode("Amsterdam")', 'geocode("1600 Pennsylvania Avenue, Washington DC")'],
        relatedTools: ['reverseGeocode', 'flyTo', 'searchPlaces'],
        create: createGeocodeTool,
    },
    reverseGeocode: {
        name: 'reverseGeocode',
        category: 'location-services',
        shortDescription: 'Convert coordinates to address',
        description: 'Convert geographic coordinates to an address',
        tags: ['coordinates', 'address', 'location', 'convert', 'lookup'],
        parameters: extractParametersFromSchema(reverseGeocodeSchema),
        examples: ['reverseGeocode(4.9, 52.4)'],
        relatedTools: ['geocode', 'getViewport'],
        create: createReverseGeocodeTool,
    },
    searchPlaces: {
        name: 'searchPlaces',
        category: 'location-services',
        shortDescription: 'Find places, businesses, POIs',
        description: 'Search for places, businesses, or points of interest like restaurants, hotels, gas stations',
        tags: ['search', 'find', 'places', 'poi', 'business', 'restaurant', 'hotel', 'nearby'],
        parameters: extractParametersFromSchema(searchPlacesSchema),
        examples: ['searchPlaces("restaurants")', 'searchPlaces("coffee", 4.9, 52.4, 1000)'],
        relatedTools: ['showPlaces', 'geocode', 'getViewport'],
        create: createSearchPlacesTool,
    },
    calculateRoute: {
        name: 'calculateRoute',
        category: 'location-services',
        shortDescription: 'Calculate driving routes',
        description: 'Calculate a driving route between locations with distance and duration',
        tags: ['route', 'directions', 'navigation', 'drive', 'travel', 'distance', 'duration'],
        parameters: extractParametersFromSchema(calculateRouteSchema),
        examples: [
            'calculateRoute(["Berlin", "Amsterdam"])',
            'calculateRoute(["NYC", "Hartford", "Boston"])',
            'calculateRoute(["Paris", "Lyon"], 2)',
        ],
        relatedTools: ['showRoute', 'formatDistance', 'formatDuration'],
        create: createCalculateRouteTool,
    },
    addStopToRoute: {
        name: 'addStopToRoute',
        category: 'location-services',
        shortDescription: 'Add stop to existing route',
        description:
            'Add a stop to the last shown route and re-calculate it with the new waypoint inserted at the optimal position',
        tags: ['route', 'waypoint', 'stop', 'add', 'insert', 'modify', 'update'],
        parameters: extractParametersFromSchema(addStopToRouteSchema),
        examples: [
            'addStopToRoute("Starbucks")',
            'addStopToRoute("gas station near route")',
            'addStopToRoute("Amsterdam", 1)',
        ],
        relatedTools: ['calculateRoute', 'getLastRoutes', 'showRoute'],
        create: createAddStopToRouteTool,
    },
    removeStopFromRoute: {
        name: 'removeStopFromRoute',
        category: 'location-services',
        shortDescription: 'Remove stop from existing route',
        description:
            'Remove a stop from the last shown route by its index and re-calculate it. Index 0 is the origin, the last index is the destination.',
        tags: ['route', 'waypoint', 'stop', 'remove', 'delete', 'modify', 'update'],
        parameters: extractParametersFromSchema(removeStopFromRouteSchema),
        examples: ['removeStopFromRoute(1)', 'removeStopFromRoute(2, 1)'],
        relatedTools: ['addStopToRoute', 'calculateRoute', 'getLastRoutes', 'showRoute'],
        create: createRemoveStopFromRouteTool,
    },
    getLastSearchResults: {
        name: 'getLastSearchResults',
        category: 'location-services',
        shortDescription: 'Get last search service results',
        description: 'Get the most recent search results from the last search service call',
        tags: ['get', 'last', 'search', 'results', 'history', 'service'],
        parameters: extractParametersFromSchema(getLastSearchResultsSchema),
        examples: ['getLastSearchResults()'],
        relatedTools: ['searchPlaces', 'getLastPlaces'],
        create: createGetLastSearchResultsTool,
    },
    getLastRoutes: {
        name: 'getLastRoutes',
        category: 'location-services',
        shortDescription: 'Get last route service results',
        description: 'Get the most recent routes from the last route calculation service call',
        tags: ['get', 'last', 'routes', 'history', 'service'],
        parameters: extractParametersFromSchema(getLastRoutesSchema),
        examples: ['getLastRoutes()'],
        relatedTools: ['calculateRoute', 'showRoute'],
        create: createGetLastRoutesTool,
    },
    getLastGeocodedResult: {
        name: 'getLastGeocodedResult',
        category: 'location-services',
        shortDescription: 'Get last geocoding service result',
        description: 'Get the most recent geocoded location from the last geocoding service call',
        tags: ['get', 'last', 'geocode', 'result', 'history', 'service'],
        parameters: extractParametersFromSchema(getLastGeocodedResultSchema),
        examples: ['getLastGeocodedResult()'],
        relatedTools: ['geocode', 'getLastPlaces'],
        create: createGetLastGeocodedResultTool,
    },
    getLastReverseGeocodedResult: {
        name: 'getLastReverseGeocodedResult',
        category: 'location-services',
        shortDescription: 'Get last reverse geocoding service result',
        description: 'Get the most recent reverse geocoded address from the last reverse geocoding service call',
        tags: ['get', 'last', 'reverse', 'geocode', 'result', 'history', 'service'],
        parameters: extractParametersFromSchema(getLastReverseGeocodedResultSchema),
        examples: ['getLastReverseGeocodedResult()'],
        relatedTools: ['reverseGeocode', 'getLastPlaces'],
        create: createGetLastReverseGeocodedResultTool,
    },
    getLastPlaces: {
        name: 'getLastPlaces',
        category: 'location-services',
        shortDescription: 'Get last places from any service',
        description: 'Get the most recent places (from search, geocode, or reverse geocode) from the last service call',
        tags: ['get', 'last', 'places', 'history', 'service', 'aggregated'],
        parameters: extractParametersFromSchema(getLastPlacesSchema),
        examples: ['getLastPlaces()'],
        relatedTools: ['searchPlaces', 'geocode', 'reverseGeocode', 'showPlaces'],
        create: createGetLastPlacesTool,
    },
    showPlaces: {
        name: 'showPlaces',
        category: 'map-display',
        shortDescription: 'Display search results on map',
        description: 'Display the most recent search results as markers on the map',
        tags: ['display', 'show', 'markers', 'pins', 'visualize', 'map'],
        parameters: extractParametersFromSchema(showPlacesSchema),
        examples: ['showPlaces()', 'showPlaces(false)'],
        relatedTools: ['searchPlaces', 'clearMap', 'fitBounds'],
        create: createShowPlacesTool,
    },
    showRoute: {
        name: 'showRoute',
        category: 'map-display',
        shortDescription: 'Display route on map',
        description: 'Display the most recent calculated route on the map',
        tags: ['display', 'show', 'route', 'path', 'visualize', 'map'],
        parameters: extractParametersFromSchema(showRouteSchema),
        examples: ['showRoute()', 'showRoute(1)'],
        relatedTools: ['calculateRoute', 'clearMap', 'fitBounds'],
        create: createShowRouteTool,
    },
    getShownPlaces: {
        name: 'getShownPlaces',
        category: 'map-display',
        shortDescription: 'Get places shown on map',
        description: 'Get the places currently displayed on the map (not from service, but what is actually shown)',
        tags: ['get', 'shown', 'places', 'markers', 'displayed', 'map', 'current'],
        parameters: extractParametersFromSchema(getShownPlacesSchema),
        examples: ['getShownPlaces()'],
        relatedTools: ['showPlaces', 'clearMap', 'getLastPlaces'],
        create: createGetShownPlacesTool,
    },
    getShownRoutes: {
        name: 'getShownRoutes',
        category: 'map-display',
        shortDescription: 'Get routes shown on map',
        description: 'Get the routes currently displayed on the map (not from service, but what is actually shown)',
        tags: ['get', 'shown', 'routes', 'displayed', 'map', 'current'],
        parameters: extractParametersFromSchema(getShownRoutesSchema),
        examples: ['getShownRoutes()'],
        relatedTools: ['showRoute', 'clearMap', 'getLastRoutes'],
        create: createGetShownRoutesTool,
    },
    getShownWaypoints: {
        name: 'getShownWaypoints',
        category: 'map-display',
        shortDescription: 'Get waypoints shown on map',
        description:
            'Get the route waypoints currently displayed on the map (not from service, but what is actually shown)',
        tags: ['get', 'shown', 'waypoints', 'displayed', 'map', 'current'],
        parameters: extractParametersFromSchema(getShownWaypointsSchema),
        examples: ['getShownWaypoints()'],
        relatedTools: ['showRoute', 'clearMap'],
        create: createGetShownWaypointsTool,
    },
    getShownRouteTrafficIncidents: {
        name: 'getShownRouteTrafficIncidents',
        category: 'map-display',
        shortDescription: 'Get route traffic incidents shown on map',
        description:
            'Get the route traffic incidents currently displayed on the map (not from service, but what is actually shown)',
        tags: ['get', 'shown', 'traffic', 'incidents', 'route', 'displayed', 'map', 'current', 'delay'],
        parameters: extractParametersFromSchema(getShownRouteTrafficIncidentsSchema),
        examples: ['getShownRouteTrafficIncidents()'],
        relatedTools: ['showRoute', 'clearMap', 'calculateRoute', 'getLastRoutes'],
        create: createGetShownRouteTrafficIncidentsTool,
    },
    clearMap: {
        name: 'clearMap',
        category: 'map-display',
        shortDescription: 'Remove displayed features',
        description: 'Remove displayed features from the map (places, routes, geometries)',
        tags: ['clear', 'remove', 'delete', 'hide', 'clean', 'reset'],
        parameters: extractParametersFromSchema(clearMapSchema),
        examples: ['clearMap()', 'clearMap(["places"])', 'clearMap(["places", "routes"])'],
        relatedTools: ['showPlaces', 'showRoute'],
        create: createClearMapTool,
    },
    flyTo: {
        name: 'flyTo',
        category: 'map-display',
        shortDescription: 'Move camera to location',
        description: 'Move the map camera to a specific location with animation',
        tags: ['move', 'navigate', 'camera', 'center', 'pan', 'zoom', 'animate'],
        parameters: extractParametersFromSchema(flyToSchema),
        examples: ['flyTo(4.9, 52.4)', 'flyTo(4.9, 52.4, 12)'],
        relatedTools: ['geocode', 'getViewport', 'fitBounds'],
        create: createFlyToTool,
    },
    fitBounds: {
        name: 'fitBounds',
        category: 'map-display',
        shortDescription: 'Fit map to bounding box',
        description: 'Fit the map camera to show a specific bounding box or GeoJSON features',
        tags: ['bounds', 'fit', 'zoom', 'bbox', 'extent', 'viewport'],
        parameters: extractParametersFromSchema(fitBoundsSchema),
        examples: ['fitBounds([4.8, 52.3, 5.0, 52.5])', 'fitBounds(geoJsonFeature, 100)'],
        relatedTools: ['getViewport', 'flyTo', 'showPlaces', 'showRoute'],
        create: createFitBoundsTool,
    },
    fitRouteSection: {
        name: 'fitRouteSection',
        category: 'map-display',
        shortDescription: 'Fit map to route section',
        description: 'Fit the map camera to show a specific section of a displayed route by section type and id',
        tags: ['section', 'route', 'fit', 'zoom', 'segment', 'country', 'traffic', 'motorway', 'toll'],
        parameters: extractParametersFromSchema(fitRouteSectionSchema),
        examples: ['fitRouteSection("country", "NLD-section-1")', 'fitRouteSection("traffic", "traffic-1", 100)'],
        relatedTools: ['fitBounds', 'showRoute', 'getShownRoutes', 'getShownRouteTrafficIncidents'],
        create: createFitRouteSectionTool,
    },
    getViewport: {
        name: 'getViewport',
        category: 'map-display',
        shortDescription: 'Get current map viewport',
        description: 'Get the current map viewport information (center, zoom, bounds)',
        tags: ['viewport', 'center', 'zoom', 'bounds', 'current', 'location', 'here'],
        parameters: extractParametersFromSchema(getViewportSchema),
        examples: ['getViewport()'],
        relatedTools: ['flyTo', 'fitBounds', 'searchPlaces'],
        create: createGetViewportTool,
    },
    getStandardMapStyles: {
        name: 'getStandardMapStyles',
        category: 'map-appearance',
        shortDescription: 'Get available map styles',
        description: 'Get the list of available standard map style IDs',
        tags: ['styles', 'themes', 'list', 'available', 'options'],
        parameters: extractParametersFromSchema(getStandardMapStylesSchema),
        examples: ['getStandardMapStyles()'],
        relatedTools: ['setMapStyle'],
        create: createGetStandardMapStylesTool,
    },
    setMapStyle: {
        name: 'setMapStyle',
        category: 'map-appearance',
        shortDescription: 'Change map visual theme',
        description: 'Change the map visual theme (light, dark, satellite, etc.)',
        tags: ['style', 'theme', 'appearance', 'visual', 'dark', 'light', 'satellite'],
        parameters: extractParametersFromSchema(setMapStyleSchema),
        examples: ['setMapStyle("standardDark")', 'setMapStyle("satellite")'],
        relatedTools: ['setLanguage', 'toggleLayers'],
        create: createSetMapStyleTool,
    },
    setLanguage: {
        name: 'setLanguage',
        category: 'map-appearance',
        shortDescription: 'Change map label language',
        description: 'Change the language of map labels',
        tags: ['language', 'labels', 'text', 'locale', 'translation'],
        parameters: extractParametersFromSchema(setLanguageSchema),
        examples: ['setLanguage("fr-FR")', 'setLanguage("de-DE")'],
        relatedTools: ['setMapStyle'],
        create: createSetLanguageTool,
    },
    toggleLayers: {
        name: 'toggleLayers',
        category: 'map-appearance',
        shortDescription: 'Show/hide map layers',
        description: 'Show or hide specific base map layer groups (buildings, roads, labels, etc.)',
        tags: ['layers', 'visibility', 'show', 'hide', 'buildings', 'roads', 'labels'],
        parameters: extractParametersFromSchema(toggleLayersSchema),
        examples: ['toggleLayers(false, ["buildings3D"])', 'toggleLayers(true, ["roadLabels"])'],
        relatedTools: ['togglePOIs', 'getStyleDetails'],
        create: createToggleLayersTool,
    },
    togglePOIs: {
        name: 'togglePOIs',
        category: 'map-appearance',
        shortDescription: 'Show/hide POI icons',
        description: 'Show or hide built-in map POI icons with optional category filtering',
        tags: ['poi', 'icons', 'visibility', 'show', 'hide', 'categories'],
        parameters: extractParametersFromSchema(togglePOIsSchema),
        examples: ['togglePOIs(false)', 'togglePOIs(true, ["RESTAURANT", "CAFE"])'],
        relatedTools: ['toggleLayers', 'searchPlaces'],
        create: createTogglePOIsTool,
    },
    toggleTrafficFlow: {
        name: 'toggleTrafficFlow',
        category: 'map-appearance',
        shortDescription: 'Show/hide traffic flow',
        description: 'Show or hide the real-time traffic flow layer',
        tags: ['traffic', 'flow', 'congestion', 'visibility', 'show', 'hide'],
        parameters: extractParametersFromSchema(toggleTrafficFlowSchema),
        examples: ['toggleTrafficFlow(true)', 'toggleTrafficFlow(false)'],
        relatedTools: ['toggleTrafficIncidents', 'calculateRoute'],
        create: createToggleTrafficFlowTool,
    },
    toggleTrafficIncidents: {
        name: 'toggleTrafficIncidents',
        category: 'map-appearance',
        shortDescription: 'Show/hide traffic incidents',
        description: 'Show or hide the real-time traffic incidents layer',
        tags: ['traffic', 'incidents', 'accidents', 'visibility', 'show', 'hide'],
        parameters: extractParametersFromSchema(toggleTrafficIncidentsSchema),
        examples: ['toggleTrafficIncidents(true)', 'toggleTrafficIncidents(false)'],
        relatedTools: ['toggleTrafficFlow', 'calculateRoute'],
        create: createToggleTrafficIncidentsTool,
    },
    getStyleDetails: {
        name: 'getStyleDetails',
        category: 'advanced',
        shortDescription: 'Get layer IDs and properties',
        description: 'Get layer IDs with their layout/paint properties from MapLibre style',
        tags: ['style', 'layers', 'maplibre', 'inspect', 'properties', 'advanced'],
        parameters: extractParametersFromSchema(getStyleSchema),
        examples: ['getStyleDetails()', 'getStyleDetails("road")', 'getStyleDetails("water")'],
        relatedTools: ['setLayoutProperty', 'setPaintProperty'],
        create: createGetStyleDetailsTool,
    },
    setLayoutProperty: {
        name: 'setLayoutProperty',
        category: 'advanced',
        shortDescription: 'Set layer layout property',
        description: 'Set a layout property for a specific layer (visibility, text-field, icon-size)',
        tags: ['layout', 'property', 'layer', 'maplibre', 'style', 'visibility', 'advanced'],
        parameters: extractParametersFromSchema(setLayoutPropertySchema),
        examples: ['setLayoutProperty("road-label", "visibility", "none")'],
        relatedTools: ['getStyleDetails', 'setPaintProperty'],
        create: createSetLayoutPropertyTool,
    },
    setPaintProperty: {
        name: 'setPaintProperty',
        category: 'advanced',
        shortDescription: 'Set layer paint property',
        description: 'Set a paint property for a specific layer (colors, widths, sizes)',
        tags: ['paint', 'property', 'layer', 'maplibre', 'style', 'color', 'width', 'advanced'],
        parameters: extractParametersFromSchema(setPaintPropertySchema),
        examples: ['setPaintProperty("water", "fill-color", "#0000ff")'],
        relatedTools: ['getStyleDetails', 'setLayoutProperty'],
        create: createSetPaintPropertyTool,
    },
    formatDistance: {
        name: 'formatDistance',
        category: 'utilities',
        shortDescription: 'Format distance for display',
        description: 'Format a distance in meters into a human-readable string',
        tags: ['format', 'distance', 'convert', 'units', 'display', 'utility'],
        parameters: extractParametersFromSchema(formatDistanceSchema),
        examples: ['formatDistance(2500)', 'formatDistance(5000, "imperial_us")'],
        relatedTools: ['formatDuration', 'calculateRoute'],
        create: createFormatDistanceTool,
    },
    formatDuration: {
        name: 'formatDuration',
        category: 'utilities',
        shortDescription: 'Format duration for display',
        description: 'Format a duration in seconds into a human-readable time string',
        tags: ['format', 'duration', 'time', 'convert', 'display', 'utility'],
        parameters: extractParametersFromSchema(formatDurationSchema),
        examples: ['formatDuration(3600)', 'formatDuration(9000)'],
        relatedTools: ['formatDuration', 'calculateRoute'],
        create: createFormatDurationTool,
    },
};

/**
 * Get tools by category.
 */
export function getToolsByCategory(category: ToolCategory): ToolMetadata[] {
    return Object.values(TOOL_REGISTRY).filter((tool) => tool.category === category);
}

/**
 * Search tools by query string (searches name, description, and tags).
 */
export function searchToolsInRegistry(query: string): ToolMetadata[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(TOOL_REGISTRY).filter((tool) => {
        return (
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery) ||
            tool.shortDescription.toLowerCase().includes(lowerQuery) ||
            tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
    });
}

/**
 * Get tool metadata by name.
 */
export function getToolMetadata(toolName: keyof typeof TOOL_REGISTRY): ToolMetadata;
export function getToolMetadata(toolName: string): ToolMetadata | undefined;
export function getToolMetadata(toolName: string): ToolMetadata | undefined {
    return TOOL_REGISTRY[toolName];
}

/**
 * Create a tool instance from the registry.
 */
export function createToolFromRegistry(toolName: keyof typeof TOOL_REGISTRY, context: ToolContext): Tool;
export function createToolFromRegistry(toolName: string, context: ToolContext): Tool | undefined;
export function createToolFromRegistry(toolName: string, context: ToolContext): Tool | undefined {
    const metadata = TOOL_REGISTRY[toolName];
    return metadata?.create(context);
}

/**
 * Create all tools from the registry.
 */
export function createAllToolsFromRegistry(context: ToolContext): { [K in keyof typeof TOOL_REGISTRY]: Tool } {
    const tools = {} as { [K in keyof typeof TOOL_REGISTRY]: Tool };
    for (const name in TOOL_REGISTRY) {
        tools[name] = TOOL_REGISTRY[name].create(context);
    }
    return tools;
}
