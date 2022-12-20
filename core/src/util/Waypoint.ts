import { Feature, GeoJsonObject, Point } from "geojson";
import { HasLngLat, Waypoint } from "../types";
import { getLngLatArray, toPointFeature } from "./LngLat";

/**
 * Builds a soft waypoint object with the given location coordinates and radius.
 * @param hasLngLat The location to extract coordinates from.
 * @param radiusMeters The radius in meters for the soft waypoint.
 * @group Route
 * @category Functions
 */
export const asSoftWaypoint = (hasLngLat: HasLngLat, radiusMeters: number): Waypoint => {
    let inputAsFeature: Feature<Point>;
    if (Array.isArray(hasLngLat) || (hasLngLat as GeoJsonObject).type !== "Feature") {
        inputAsFeature = toPointFeature(getLngLatArray(hasLngLat));
    } else {
        inputAsFeature = hasLngLat as Feature<Point>;
    }
    return {
        ...inputAsFeature,
        properties: {
            ...inputAsFeature.properties,
            radiusMeters
        }
    };
};
