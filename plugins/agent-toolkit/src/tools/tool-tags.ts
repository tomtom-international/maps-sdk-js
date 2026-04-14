/**
 * @module agent-toolkit-tools
 */

/**
 * All valid tool tags for categorizing tools.
 */
export const TOOL_TAGS = [
    'location',
    'route',
    'waypoint',
    'place',
    'locate',
    'discover',
    'traffic',
    'map style',
    'utilities',
    'search',
    'detour',
    'along-route',
    'reachable-range',
    'isochrone',
    'range',
    'EV',
    'coverage',
    'recall',
    'state',
    // Route section types (from SDK sectionTypes)
    'carpool',
    'carTrain',
    'country',
    'ferry',
    'importantRoadStretch',
    'lanes',
    'leg',
    'lowEmissionZone',
    'motorway',
    'pedestrian',
    'roadShields',
    'speedLimit',
    'toll',
    'tollVignette',
    'tunnel',
    'unpaved',
    'urban',
    'vehicleRestricted',
] as const;

/** Union of all valid tool tags, derived from {@link TOOL_TAGS}. */
export type ToolTag = (typeof TOOL_TAGS)[number];
