import { Feature, Point, Position } from "geojson";
import { HasLngLat } from "../types";

/**
 * @ignore
 * @param hasLngLat
 */
export const getLngLatArray = (hasLngLat: HasLngLat): Position => {
    if (hasLngLat) {
        if (Array.isArray(hasLngLat)) {
            return hasLngLat;
        } else if ((hasLngLat as Point).coordinates) {
            return (hasLngLat as Point).coordinates;
        } else if ((hasLngLat as Feature).geometry) {
            return (hasLngLat as Feature<Point>).geometry.coordinates;
        }
    }
    throw new Error("The received object does not have lng-lat coordinates");
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
