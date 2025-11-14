import type { GetPositionEntryPointOption, inputSectionTypes, RoutePlanningLocation } from '@tomtom-org/maps-sdk/core';
import type { CommonRoutingParams, CommonServiceParams } from '../../shared';
import type { CalculateRouteRequestAPI } from './apiRequestTypes';
import type { CalculateRouteResponseAPI } from './apiResponseTypes';

/**
 * Route section type that can be requested in routing parameters.
 *
 * @remarks
 * Note: Some section types (like "leg") are automatically included regardless of this parameter.
 *
 * @group Routing
 */
export type InputSectionType = (typeof inputSectionTypes)[number];

/**
 * Array of section types to include in the route response.
 *
 * Sections divide the route into portions with specific characteristics, helping you
 * display additional context like toll roads, ferry crossings, or traffic incidents.
 *
 * @remarks
 * Available section types:
 * - `carTrain`: Sections requiring car train transport
 * - `ferry`: Water crossings requiring ferry
 * - `tunnel`: Underground tunnel sections
 * - `motorway`: Highway/freeway sections
 * - `pedestrian`: Pedestrian-only sections
 * - `toll`: Sections requiring toll payment
 * - `tollVignette`: Sections requiring toll vignette
 * - `country`: Different countries traversed
 * - `traffic`: Sections with traffic incidents
 * - `vehicleRestricted`: Sections with vehicle restrictions
 * - `carpool`: HOV/carpool lane sections
 * - `urban`: Urban area sections
 * - `unpaved`: Unpaved road sections
 * - `lowEmissionZone`: Low emission zones
 * - `speedLimit`: Speed limit changes
 * - `roadShields`: Road shield information
 *
 * @example
 * ```typescript
 * // Request toll, ferry, and traffic sections
 * const sectionTypes: InputSectionTypes = ['toll', 'ferry', 'traffic'];
 *
 * // Request all available sections
 * const sectionTypes: InputSectionTypes = inputSectionTypes;
 *
 * // Request no optional sections (leg sections still included)
 * const sectionTypes: InputSectionTypes = [];
 * ```
 *
 * @default All available section types
 *
 * @group Routing
 */
export type InputSectionTypes = InputSectionType[];

/**
 * Configuration for turn-by-turn guidance instructions.
 *
 * Specifies the format and detail level for navigation guidance.
 *
 * @example
 * ```typescript
 * // Request coded guidance with phonetics
 * const guidance: GuidanceParams = {
 *   type: 'coded',
 *   version: 2,
 *   phonetics: 'IPA',
 *   roadShieldReferences: 'all'
 * };
 * ```
 *
 * @group Routing
 */
export type GuidanceParams = {
    /**
     * Guidance instruction format type.
     *
     * Currently only 'coded' format is supported.
     */
    type: 'coded';
    /**
     * Guidance instruction version.
     *
     * @default 2
     */
    version?: 2;
    /**
     * Phonetic transcription format for street names.
     *
     * @remarks
     * - `LHP`: Language-specific phonetic representation
     * - `IPA`: International Phonetic Alphabet
     *
     * @default 'IPA'
     */
    phonetics?: 'LHP' | 'IPA';
    /**
     * Include road shield references for displaying road signs.
     *
     * When set to 'all', includes references to road shield images
     * that can be fetched from the TomTom Road Shield API.
     */
    roadShieldReferences?: 'all';
};

/**
 * Extended route representation options.
 *
 * Controls which additional progress information is included at route polyline points.
 *
 * @remarks
 * - `distance`: Cumulative distance from start to each point
 * - `travelTime`: Cumulative travel time from start to each point
 *
 * @example
 * ```typescript
 * // Include both distance and time progress
 * const extended: ExtendedRouteRepresentation[] = ['distance', 'travelTime'];
 * ```
 *
 * @default ['distance', 'travelTime']
 *
 * @group Routing
 */
export type ExtendedRouteRepresentation = 'distance' | 'travelTime';

/**
 * Traffic computation mode for alternative travel time estimates.
 *
 * Controls whether to calculate additional travel times using different traffic scenarios.
 *
 * @remarks
 * - `none`: Only return default best-estimate travel time
 * - `all`: Return travel times for multiple traffic scenarios:
 *   - No traffic (free flow)
 *   - Historic traffic patterns
 *   - Live traffic incidents
 *
 * @example
 * ```typescript
 * // Get all traffic-based time estimates
 * const computeTravelTimeFor: ComputeTravelTimeFor = 'all';
 * ```
 *
 * @default 'none'
 *
 * @group Routing
 */
export type ComputeTravelTimeFor = 'none' | 'all';

/**
 * Maximum number of alternative routes to calculate.
 *
 * Alternative routes provide different options for traveling between the same origin and destination.
 *
 * @remarks
 * - `0`: Only calculate the best route (default)
 * - `1-5`: Calculate best route plus up to N alternatives
 *
 * More alternatives increase computation time but provide more route options.
 *
 * @example
 * ```typescript
 * // Request up to 2 alternative routes
 * const maxAlternatives: MaxNumberOfAlternatives = 2;
 * ```
 *
 * @default 0
 *
 * @group Routing
 */
export type MaxNumberOfAlternatives = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Parameters for calculating a route between waypoints.
 *
 * Includes origin, destination, optional intermediate waypoints, and various routing options
 * to customize the calculated route based on vehicle type, traffic, and preferences.
 *
 * @example
 * ```typescript
 * // Basic route from A to B
 * const params: CalculateRouteParams = {
 *   apiKey: 'your-api-key',
 *   locations: [
 *     [4.9041, 52.3676],  // Amsterdam
 *     [4.4777, 51.9244]   // Rotterdam
 *   ]
 * };
 *
 * // Route with guidance and alternatives
 * const advancedParams: CalculateRouteParams = {
 *   apiKey: 'your-api-key',
 *   locations: [[4.9041, 52.3676], [4.4777, 51.9244]],
 *   guidance: { type: 'coded', phonetics: 'IPA' },
 *   maxAlternatives: 2,
 *   costModel: {
 *     routeType: 'fast',
 *     avoid: ['tollRoads', 'motorways']
 *   },
 *   when: {
 *     option: 'departAt',
 *     date: new Date('2025-10-20T08:00:00Z')
 *   }
 * };
 *
 * // Electric vehicle route with charging
 * const evParams: CalculateRouteParams = {
 *   apiKey: 'your-api-key',
 *   locations: [[4.9, 52.3], [8.5, 50.1]],
 *   vehicle: {
 *     engineType: 'electric',
 *     model: {
 *       engine: {
 *         consumption: {
 *           charging: { maxChargeKWH: 85 },
 *           speedToConsumption: [
 *             { speedKMH: 50, consumptionUnitsPer100KM: 8 },
 *             { speedKMH: 80, consumptionUnitsPer100KM: 12 },
 *             { speedKMH: 120, consumptionUnitsPer100KM: 18 }
 *           ]
 *         }
 *       }
 *     },
 *     state: { currentChargeInkWh: 50 }
 *   }
 * };
 * ```
 *
 * @group Routing
 */
export type CalculateRouteParams = CommonServiceParams<CalculateRouteRequestAPI, CalculateRouteResponseAPI> &
    CommonRoutingParams & {
        /**
         * Ordered list of locations (waypoints) and/or path points for route calculation.
         *
         * The route will pass through these locations in the specified order.
         *
         * @remarks
         * Requirements:
         * - Minimum 2 waypoints (origin and destination) OR 1 path with 2+ points
         * - Waypoints and paths can be mixed (except circle waypoints with paths)
         * - Circle (soft) waypoints shape the route without creating legs
         *
         * Supported formats:
         * - Coordinate arrays: `[longitude, latitude]`
         * - Waypoint objects with radius for circle waypoints
         * - Path arrays for route reconstruction
         *
         * @see [POST data parameters](https://docs.tomtom.com/routing-api/documentation/routing/calculate-route#post-data-parameters)
         *
         * @example
         * ```typescript
         * // Coordinate arrays
         * locations: [[4.9, 52.3], [4.5, 51.9]]
         *
         * // With intermediate stop
         * locations: [[4.9, 52.3], [4.7, 52.1], [4.5, 51.9]]
         *
         * // Waypoint objects with radius for circle waypoints
         * locations: [
         *   [4.9, 52.3],
         *   {
         *     type: 'Feature',
         *     geometry: { type: 'Point', coordinates: [4.7, 52.1] },
         *     properties: { radiusMeters: 5000 }
         *   },
         *   [4.5, 51.9]
         * ]
         *
         * // Path array for route reconstruction
         * locations: [
         *   [4.9, 52.3],  // Origin waypoint
         *   [
         *     [4.85, 52.25], [4.80, 52.20], [4.75, 52.15]  // Path points between waypoints
         *   ],
         *   [4.5, 51.9]   // Destination waypoint
         * ]
         * ```
         */
        locations: RoutePlanningLocation[];

        /**
         * Controls how entry points are used for routing.
         *
         * Entry points represent specific building entrances or facility access points.
         * Using them improves routing accuracy by directing to the correct entrance.
         *
         * @remarks
         * - `main-when-available`: Use main entry point if available, otherwise use place center (recommended for routing)
         * - `ignore`: Always use place center position
         *
         * @default 'main-when-available'
         *
         * @example
         * ```typescript
         * // Route to main entrance when available
         * useEntryPoints: 'main-when-available'
         * ```
         */
        useEntryPoints?: GetPositionEntryPointOption;

        /**
         * Request additional travel time calculations for different traffic scenarios.
         *
         * When set to 'all', the response includes travel times for:
         * - Free-flow (no traffic)
         * - Historic traffic patterns
         * - Current live traffic
         *
         * Useful for comparing traffic impact and displaying "X minutes saved by leaving now".
         *
         * @default 'none'
         *
         * @example
         * ```typescript
         * // Get all traffic-based estimates
         * computeAdditionalTravelTimeFor: 'all'
         * ```
         */
        computeAdditionalTravelTimeFor?: ComputeTravelTimeFor;

        /**
         * Request extended progress information at route polyline points.
         *
         * Includes cumulative distance and/or time from start to each coordinate.
         * Useful for displaying progress during navigation or animating route visualization.
         *
         * @default ['distance', 'travelTime']
         *
         * @example
         * ```typescript
         * extendedRouteRepresentations: ['distance', 'travelTime']
         * ```
         */
        extendedRouteRepresentations?: ExtendedRouteRepresentation[];

        /**
         * Request turn-by-turn guidance instructions.
         *
         * When specified, the response includes detailed navigation instructions
         * with maneuvers, road names, and optional phonetics.
         *
         * @example
         * ```typescript
         * guidance: {
         *   type: 'coded',
         *   version: 2,
         *   phonetics: 'IPA',
         *   roadShieldReferences: 'all'
         * }
         * ```
         */
        guidance?: GuidanceParams;

        /**
         * Route section types to include in the response.
         *
         * Sections help you display route characteristics like tolls, ferries, or traffic.
         * Leg sections are always included regardless of this parameter.
         *
         * @default All available section types
         *
         * @example
         * ```typescript
         * // Request specific sections
         * sectionTypes: ['toll', 'ferry', 'traffic', 'country']
         *
         * // Request no optional sections
         * sectionTypes: []
         * ```
         */
        sectionTypes?: InputSectionTypes;

        /**
         * Maximum number of alternative routes to calculate.
         *
         * Alternative routes provide different travel options between the same origin and destination.
         * Each alternative is optimized differently (e.g., avoiding highways, minimizing tolls).
         *
         * @remarks
         * - More alternatives increase response time
         * - Alternatives are returned in order of quality (best first)
         * - Not all requests will return the maximum number of alternatives
         *
         * @default 0
         *
         * @example
         * ```typescript
         * // Request up to 2 alternatives
         * maxAlternatives: 2
         * ```
         */
        maxAlternatives?: MaxNumberOfAlternatives;
    };
