import type { RoutePlanningLocation, RoutePlanningLocationType } from '../types';

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
