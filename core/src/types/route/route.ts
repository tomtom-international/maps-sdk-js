import type { Feature, LineString } from 'geojson';
import type { BBox, FeatureCollectionWithProperties, Guidance, RouteSummary, SectionsProps } from '../';

/**
 * Array of all available route avoidance options.
 *
 * This constant defines the complete set of road/route features that can be avoided
 * during route calculation. Use this to derive the {@link Avoidable} type or to validate
 * user input against supported avoidance options.
 *
 * @remarks
 * This is a readonly tuple used as the source of truth for valid avoidance types.
 * The {@link Avoidable} type is derived from this array to ensure type safety.
 *
 * @example
 * ```typescript
 * // Check if a string is a valid avoidance type
 * const userInput = 'tollRoads';
 * if (avoidableTypes.includes(userInput as Avoidable)) {
 *   // userInput is valid
 * }
 *
 * // Iterate over all available options
 * avoidableTypes.forEach(type => {
 *   console.log(`Available option: ${type}`);
 * });
 * ```
 *
 * @group Route
 */
export const avoidableTypes = [
    'tollRoads',
    'motorways',
    'ferries',
    'unpavedRoads',
    'carpools',
    'alreadyUsedRoads',
    'borderCrossings',
    'tunnels',
    'carTrains',
    'lowEmissionZones',
] as const;

/**
 * Route features that the routing engine will attempt to avoid when calculating routes.
 *
 * Use these options to customize routes based on vehicle capabilities, user preferences,
 * or regulatory requirements. Note that avoidance is not guaranteed if no alternative route exists.
 *
 * @remarks
 * Available avoidance options:
 * - `tollRoads`: Avoids roads requiring toll payments
 * - `motorways`: Avoids high-speed limited-access highways (useful for scenic routes or vehicle restrictions)
 * - `ferries`: Avoids water crossings requiring ferry transport
 * - `unpavedRoads`: Avoids unpaved/dirt roads (recommended for standard vehicles)
 * - `carpools`: Avoids carpool/HOV (High Occupancy Vehicle) lanes
 * - `alreadyUsedRoads`: Prevents using the same road segment multiple times (useful for delivery routes)
 * - `borderCrossings`: Avoids crossing international borders (useful for customs/visa considerations)
 * - `tunnels`: Avoids underground tunnels (useful for vehicles carrying hazardous materials)
 * - `carTrains`: Avoids car train transport segments
 * - `lowEmissionZones`: Avoids zones with vehicle emission restrictions
 *
 * @example
 * ```typescript
 * // Avoid tolls and motorways for a scenic route
 * const avoid: Avoidable[] = ['tollRoads', 'motorways'];
 *
 * // Avoid unpaved roads for a standard car
 * const avoid: Avoidable[] = ['unpavedRoads'];
 * ```
 *
 * @group Route
 */
export type Avoidable = (typeof avoidableTypes)[number];

/**
 * Primary mode of transportation for route calculation.
 *
 * Currently only `'car'` is supported. This determines road type preferences,
 * speed calculations, and routing rules applied to the calculated route.
 *
 * @remarks
 * Future versions may support additional modes like truck, taxi, bus, bicycle, and pedestrian.
 *
 * @example
 * ```typescript
 * const travelMode: TravelMode = 'car';
 * ```
 *
 * @group Route
 */
export type TravelMode = 'car'; // TODO no longer supported | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian";

/**
 * Cumulative distance and time measurements at a position along the route.
 *
 * Both fields are optional because a progress entry may omit either value.
 * Use {@link RouteProgressAtPoint} for the resolved (always-present) equivalent
 * returned by interpolation utilities.
 *
 * @group Route
 */
export type RouteProgress = {
    /**
     * Cumulative travel time in seconds from the route start.
     */
    travelTimeInSeconds?: number;
    /**
     * Cumulative distance in meters from the route start.
     */
    distanceInMeters?: number;
};

/**
 * Progress measurements tied to a specific coordinate on the route path.
 *
 * Extends {@link RouteProgress} with a `pointIndex` that identifies the
 * corresponding entry in the route's coordinate array.
 *
 * @remarks
 * - The `progress` array on a route always contains entries for the first and last points
 * - Progress for intermediate points can be linearly interpolated between entries
 *
 * @example
 * ```typescript
 * const points: RouteProgressPoint[] = [
 *   { pointIndex: 0,   travelTimeInSeconds: 0,   distanceInMeters: 0    },
 *   { pointIndex: 50,  travelTimeInSeconds: 120,  distanceInMeters: 2500 },
 *   { pointIndex: 100, travelTimeInSeconds: 300,  distanceInMeters: 5000 }
 * ];
 * ```
 *
 * @group Route
 */
export type RouteProgressPoint = RouteProgress & {
    /**
     * Zero-based index of this point in the route's coordinate array.
     */
    pointIndex: number;
};

/**
 * Resolved distance and time measurements at an interpolated position on the route path.
 *
 * Both fields are required because this type is only produced when interpolation
 * can be fully resolved (i.e. the bracketing progress entries both carry valid values).
 *
 * @group Route
 */
export type RouteProgressAtPoint = Required<RouteProgress>;

/**
 * Progress measurements for a segment between two arbitrary points on the route path.
 *
 * @group Route
 */
export type RouteSegmentProgress = {
    /** Progress at the start point. */
    start: RouteProgressAtPoint;
    /** Progress at the end point. */
    end: RouteProgressAtPoint;
    /** Difference between end and start (distance and time covered by the segment). */
    delta: RouteProgressAtPoint;
};

/**
 * Properties object for a calculated route.
 *
 * Contains all route information including summary statistics, sections,
 * guidance instructions, and progress data.
 *
 * @group Route
 */
export type RouteProps = {
    /**
     * Summary statistics for the entire route.
     *
     * Contains departure/arrival times, total length, duration, and consumption estimates.
     */
    summary: RouteSummary;
    /**
     * Route sections with specific characteristics.
     *
     * Sections represent portions of the route with distinct properties such as:
     * - Countries traversed
     * - Traffic incidents
     * - Route legs (segments between waypoints)
     * - Special road types (tunnels, ferries, toll roads)
     */
    sections: SectionsProps;
    /**
     * Turn-by-turn navigation instructions.
     *
     * Only present when guidance was requested and is available.
     * Includes maneuvers, road names, and instruction text.
     */
    guidance?: Guidance;
    /**
     * Distance and time progress at key points along the route.
     *
     * * Present when extended route representations are requested, which is the default for route calculations.
     * * Useful for displaying progress information or calculating intermediate times.
     */
    progress?: RouteProgressPoint[];
    /**
     * Index of this route in the collection of alternatives.
     *
     * The first route (index 0) is typically the recommended/best route.
     * Subsequent indices represent alternative routes.
     */
    index: number;
};

/**
 * GeoJSON Feature representing a calculated route.
 *
 * The geometry is a LineString containing the route path coordinates.
 * The properties contain all route information (summary, sections, guidance).
 *
 * @typeParam P - Type of the route properties (defaults to RouteProps)
 *
 * @example
 * ```typescript
 * const route: Route = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[4.9, 52.3], [4.91, 52.31], ...]
 *   },
 *   properties: {
 *     id: 'route-123',
 *     summary: { lengthInMeters: 5000, travelTimeInSeconds: 300, ... },
 *     sections: { ... },
 *     index: 0
 *   }
 * };
 * ```
 *
 * @group Route
 */
export type Route<P extends RouteProps = RouteProps> = Omit<Feature<LineString, P>, 'id' | 'bbox'> & {
    /**
     * Unique identifier for this route.
     *
     * Randomly generated to distinguish between multiple route alternatives.
     */
    id: string;

    /**
     * Bounding box that contains the entire route or at least its waypoints.
     */
    bbox: BBox;
};

/**
 * GeoJSON FeatureCollection containing one or more calculated routes.
 *
 * Typically contains the main route (index 0) and optional alternative routes.
 * Collection properties can include metadata about the routing request.
 *
 * @typeParam P - Type of individual route properties (defaults to RouteProps)
 * @typeParam FeatureCollectionProps - Type of collection-level properties
 *
 * @example
 * ```typescript
 * const routes: Routes = {
 *   type: 'FeatureCollection',
 *   features: [
 *     { type: 'Feature', geometry: {...}, properties: { index: 0, ... } }, // Main route
 *     { type: 'Feature', geometry: {...}, properties: { index: 1, ... } }  // Alternative
 *   ],
 *   properties: {
 *     requestId: 'req-456',
 *     calculatedAt: new Date()
 *   }
 * };
 * ```
 *
 * @group Route
 */
export type Routes<P extends RouteProps = RouteProps, FeatureCollectionProps = unknown> = Omit<
    FeatureCollectionWithProperties<LineString, P, FeatureCollectionProps>,
    'features' | 'bbox'
> & {
    /**
     * Array of route features.
     */
    features: Route<P>[];

    /**
     * Bounding box that contains all the routes or at least their waypoints. Only defined if routes are present.
     */
    bbox?: BBox;
};
