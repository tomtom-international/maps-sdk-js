import type { Feature, FeatureCollection, Point, Position } from 'geojson';
import type { Anything } from '../generic';
import type { HasLngLat } from '../polygonFeature';
import type { Route } from './route';

/**
 * GeoInputs-specific properties.
 * @group Route
 * @category Types
 */
export type WaypointProps = {
    /**
     * The radius of the circle(soft) waypoint.
     *
     * When set, the waypoint is considered a circle(soft) waypoint.
     * * A circle or soft waypoint is a type of waypoint which is used to shape the route line without generating
     * any extra leg or specific guidance for it.
     * * The routing engine calculates, for the given planning criteria, the best path for the route to follow
     * while intersecting with the waypoint circle.
     * * The larger the circle, the more freedom of calculation for the route line through it.
     * * When the circle is smaller, almost resembling a point,
     * the route line goes most precisely through it while respecting the road network.
     *
     * Must be a positive integer with a maximum value of 135000.
     */
    radiusMeters?: number;
};

/**
 * GeoJSON waypoint type.
 *
 * Consists of a Point Feature with waypoint and other optional properties.
 * @group Route
 * @category Types
 */
export type Waypoint<T extends Anything = Anything> = Feature<Point, WaypointProps & T>;

/**
 * GeoJSON collection of waypoints.
 * @group Route
 * @category Types
 */
export type Waypoints<T extends Anything = Anything> = FeatureCollection<Point, WaypointProps & T>;

/**
 * A waypoint-like input is either a complex waypoint object or anything with point coordinates.
 * * By default, waypoints are considered as single points,
 * unless a radius is specified, which then implicitly transforms the waypoint into a circle(soft waypoint).
 * @group Route
 * @category Types
 */
export type WaypointLike = Waypoint | HasLngLat;

/**
 * A route or a route path.
 * @group Route
 * @category Types
 */
export type PathLike = Position[] | Route;

/**
 * A GeoInput is a location-like input for route planning. It can be either:
 * * a waypoint: an individual place.
 * * a path: a path or route to follow.
 * @group Route
 * @category Types
 */
export type GeoInput = WaypointLike | PathLike;

/**
 * The overall type of a GeoInput.
 * * "waypoint" refers to WaypointLike inputs.
 * * "path" refers to PathLike inputs.
 * @group Route
 * @category Types
 */
export type GeoInputType = 'waypoint' | 'path';
