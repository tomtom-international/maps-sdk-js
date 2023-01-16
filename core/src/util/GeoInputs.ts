import { Feature, GeoJsonObject, Point } from "geojson";
import { GeoInput, GeoInputType, HasLngLat, Waypoint } from "../types";
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

/**
 * @group Route
 * @category Functions
 */
export const getGeoInputType = (geoInput: GeoInput): GeoInputType => {
    if (Array.isArray(geoInput)) {
        if (Array.isArray(geoInput[0])) {
            return "path";
        } else {
            return "waypoint";
        }
    } else if (geoInput.type === "Feature") {
        if (geoInput.geometry.type === "LineString") {
            return "path";
        } else {
            return "waypoint";
        }
    } else {
        // assuming Point geometries:
        return "waypoint";
    }
};
