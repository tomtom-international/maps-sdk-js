import type { Feature, GeoJsonObject, Point } from 'geojson';
import type { HasLngLat, RoutePlanningLocation, RoutePlanningLocationType, Waypoint } from '../types';
import { getPositionStrict, toPointFeature } from './lngLat';

/**
 * Creates a soft waypoint with a flexible radius for route calculation.
 *
 * A soft waypoint allows the routing algorithm to find the optimal path within
 * a specified radius of the target location, rather than forcing the route to
 * pass through the exact point. This is useful for:
 * - Allowing the router to stay on major roads instead of detouring
 * - Creating more efficient routes when exact location isn't critical
 * - Simulating "pass near" behavior in route planning
 *
 * The resulting waypoint is a GeoJSON Point Feature with a `radiusMeters` property
 * that the routing service uses to optimize the path.
 *
 * @param hasLngLat The location to extract coordinates from. Can be a coordinate array,
 *                  Point geometry, or Point Feature.
 * @param radiusMeters The radius in meters within which the route can pass.
 *                     The routing service will find the optimal point within this radius.
 * @returns A waypoint Feature with the radiusMeters property set.
 *
 * @example
 * ```typescript
 * // Create a soft waypoint from coordinates
 * // Route can pass anywhere within 500m of this point
 * const softWaypoint = asSoftWaypoint([4.9, 52.3], 500);
 *
 * // Use in route calculation
 * const route = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [
 *     [4.9, 52.3],              // Hard waypoint (exact location)
 *     asSoftWaypoint([5.1, 52.5], 1000),  // Soft waypoint (within 1km)
 *     [5.3, 52.7]               // Hard waypoint (exact location)
 *   ]
 * });
 *
 * // Create soft waypoint from a Place Feature
 * const place = await geocode({ key: 'your-api-key', query: 'Amsterdam' });
 * const softPlace = asSoftWaypoint(place, 2000);
 * // Route will pass within 2km of Amsterdam center
 * ```
 *
 * @see [Locations Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/routing/locations)
 *
 * @group Route
 */
export const asSoftWaypoint = (hasLngLat: HasLngLat, radiusMeters: number): Waypoint => {
    let inputAsFeature: Feature<Point>;
    if (Array.isArray(hasLngLat) || (hasLngLat as GeoJsonObject).type !== 'Feature') {
        inputAsFeature = toPointFeature(getPositionStrict(hasLngLat));
    } else {
        inputAsFeature = hasLngLat as Feature<Point>;
    }
    return { ...inputAsFeature, properties: { ...inputAsFeature.properties, radiusMeters } };
};

/**
 * Determines the type of geographic input (waypoint or path).
 *
 * This function inspects the structure of a RoutePlanningLocation to classify it as either:
 * - **waypoint**: A single point location (coordinate pair, Point geometry, or Point Feature)
 * - **path**: A line or route (array of coordinates, LineString geometry, or LineString Feature)
 *
 * @param routePlanningLocation The geographic input to classify. Can be coordinates, GeoJSON geometry, or GeoJSON Feature.
 * @returns The type of the input: 'waypoint' for point locations or 'path' for line geometries.
 *
 * @ignore
 */
export const getRoutePlanningLocationType = (
    routePlanningLocation: RoutePlanningLocation,
): RoutePlanningLocationType => {
    if (Array.isArray(routePlanningLocation)) {
        if (Array.isArray(routePlanningLocation[0])) {
            return 'path';
        }
        return 'waypoint';
    }
    if (routePlanningLocation.type === 'Feature') {
        if (routePlanningLocation.geometry.type === 'LineString') {
            return 'path';
        }
        return 'waypoint';
    }
    // assuming Point geometries:
    return 'waypoint';
};
