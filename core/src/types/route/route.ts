import type { Feature, LineString } from 'geojson';
import type { Guidance } from './guidance';
import type { SectionsProps } from './sections';
import type { RouteSummary } from './summary';
import type { FeatureCollectionWithProperties } from '../extendedGeoJSON';

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
 * Specifies something that the route calculation should try to avoid when determining the route.
 * Possible values:
 * * tollRoads: avoids toll roads.
 * * motorways: avoids motorways.
 * * ferries: avoids ferries.
 * * unpavedRoads: avoids unpaved roads.
 * * carpools: avoids routes that require use of a carpool (HOV/ High Occupancy Vehicle) lanes.
 * * alreadyUsedRoads: avoids using the same road multiple times.
 * * borderCrossings: avoids crossing country borders.
 * * tunnels: avoids tunnels.
 * * carTrains: avoids car trains.
 * * lowEmissionZones: avoids low-emission zones.
 * @group Route
 * @category Types
 */
export type Avoidable = (typeof avoidableTypes)[number];

/**
 * Primary means of transportation to be used in a route.
 * @group Route
 * @category Types
 */
export type TravelMode = 'car'; // TODO no longer supported | "truck" | "taxi" | "bus" | "van" | "motorcycle" | "bicycle" | "pedestrian";

export type RouteProgressPoint = {
    /**
     * Index of the point in the route.
     */
    pointIndex: number;
    /**
     * Distance (in meters) from the start of the route to this point.
     */
    travelTimeInSeconds?: number;
    /**
     * Travel time (in seconds) from the start of the route to this point.
     */
    distanceInMeters?: number;
};

/**
 * This field is included if extendedRouteRepresentations is used.
 *
 * * It always contains entries for the first and the last point in the route.
 * * For any pair of consecutive entries in the progress array,
 * progress for pointIndex values that are not explicitly present and are enclosed by said pair,
 * can be linearly interpolated by summing up straight line distances of the leg points.
 * * The Haversine formula is precise enough to compute such distances.
 */
export type RouteProgress = RouteProgressPoint[];

/**
 * @group Route
 * @category Types
 */
export type RouteProps = {
    /**
     * Random generated id.
     */
    id: string;
    /**
     * Common summary type for the route.
     * * Contains departure/arrival times, lengths and durations.
     */
    summary: RouteSummary;
    /**
     * Route sections are parts of the planned route that have specific characteristics.
     */
    sections: SectionsProps;
    /**
     * Contains guidance related elements. This field is present only when guidance was requested and is available.
     */
    guidance?: Guidance;
    /**
     * Key distance and time progress along the route path.
     */
    progress?: RouteProgress;
    /**
     * Index related to other routes.
     * * By default, the first route (index 0) is considered the main one, and the next one are alternatives.
     */
    index: number;
};

/**
 * @group Route
 * @category Types
 */
export type Route<P extends RouteProps = RouteProps> = Feature<LineString, P>;

/**
 * @group Route
 * @category Types
 */
export type Routes<
    P extends RouteProps = RouteProps,
    FeatureCollectionProps = unknown,
> = FeatureCollectionWithProperties<LineString, P, FeatureCollectionProps>;
