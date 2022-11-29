import { Feature, FeatureCollection, Point } from "geojson";
import { Anything } from "../Generic";
import { HasLngLat } from "../Geometry";

/**
 * Waypoint-specific properties.
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
 * GeoJSON Waypoint type.
 *
 * Consists of a Point Feature with waypoint and other optional properties.
 * @group Route
 * @category Types
 */
export type Waypoint<T extends Anything = Anything> = Feature<Point, WaypointProps & T>;

export type Waypoints<T extends Anything = Anything> = FeatureCollection<Point, WaypointProps & T>;

/**
 * A waypoint-like input is either a complex waypoint object or anything with point coordinates.
 * * By default, waypoints are considered as single points,
 * unless a radius is specified, which then implicitly transforms the waypoint into a circle(soft waypoint).
 * @group Route
 * @category Types
 */
export type WaypointLike = Waypoint | HasLngLat;
