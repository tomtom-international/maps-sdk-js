import type { Feature, Point, Position } from "geojson";
import type { EntryPoint, GetPositionOptions, HasLngLat, Place } from "../types";

const getMainEntryPoint = (place: Place): EntryPoint | undefined =>
    place?.properties?.entryPoints?.find((entryPoint) => entryPoint.type === "main");

/**
 * Extracts the lng-lat position for the given object.
 * @param hasLngLat An object which either is or contains a lng-lat position.
 * @param options Additional options to control how we extract the position.
 */
export const getPosition = (hasLngLat: HasLngLat | undefined, options?: GetPositionOptions): Position | null => {
    if (hasLngLat) {
        if (Array.isArray(hasLngLat)) {
            // GeoJSON Position (lng-lat):
            return hasLngLat;
        } else if ((hasLngLat as Point).coordinates) {
            // GeoJSON Point Geometry:
            return (hasLngLat as Point).coordinates;
        } else if ((hasLngLat as Feature).geometry) {
            // GeoJSON Point Feature:
            if (options?.useEntryPoint == "main-when-available") {
                const mainEntryPoint = getMainEntryPoint(hasLngLat as Place);
                return mainEntryPoint?.position ?? (hasLngLat as Feature<Point>).geometry.coordinates;
            }
            return (hasLngLat as Feature<Point>).geometry.coordinates;
        }
    }
    return null;
};

/**
 * Extracts the lng-lat position for the given object.
 * * If the input does not contain a position, an error is thrown.
 * @param hasLngLat An object which either is or contains a lng-lat position.
 * @param options Additional options to control how we extract the position.
 * @throws error if the input object is undefined or does not contain a lng-lat position.
 */
export const getPositionStrict = (hasLngLat: HasLngLat, options?: GetPositionOptions): Position => {
    const position = getPosition(hasLngLat, options);
    if (!position) {
        throw new Error(`The received object does not have lng-lat coordinates: ${JSON.stringify(hasLngLat)}`);
    }
    return position;
};

/**
 * @ignore
 * @param lngLat
 */
export const toPointFeature = (lngLat: Position): Feature<Point> => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: lngLat } as Point,
    properties: {}
});
