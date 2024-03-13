import { Feature, Point, Position } from "geojson";
import { HasLngLat } from "../types";

/**
 * Extracts the lng-lat position for the given object.
 * @ignore
 * @param hasLngLat An object which either is or contains a lng-lat position.
 */
export const getPosition = (hasLngLat: HasLngLat): Position | null => {
    if (hasLngLat) {
        if (Array.isArray(hasLngLat)) {
            return hasLngLat;
        } else if ((hasLngLat as Point).coordinates) {
            return (hasLngLat as Point).coordinates;
        } else if ((hasLngLat as Feature).geometry) {
            return (hasLngLat as Feature<Point>).geometry.coordinates;
        }
    }
    return null;
};

/**
 * Extracts the lng-lat position for the given object.
 * * If the input does not contain lng-lat, an error is thrown.
 * @ignore
 * @param hasLngLat An object which either is or contains a lng-lat position.
 * @throws error if the input object is undefined or does not contain a lng-lat position.
 */
export const getPositionStrict = (hasLngLat: HasLngLat): Position => {
    const position = getPosition(hasLngLat);
    if (!position) {
        throw new Error("The received object does not have lng-lat coordinates");
    }
    return position;
};

/**
 * @ignore
 * @param lngLat
 */
export const toPointFeature = (lngLat: Position): Feature<Point> => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: lngLat
    } as Point,
    properties: {}
});
