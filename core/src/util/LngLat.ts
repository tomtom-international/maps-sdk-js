import { Feature, Point } from "geojson";
import { HasLngLat } from "../types/Geometry";

export const getLngLatArray = (hasLngLat: HasLngLat): number[] => {
    if (Array.isArray(hasLngLat)) {
        return hasLngLat;
    } else if ((hasLngLat as Point).coordinates) {
        return (hasLngLat as Point).coordinates;
    } else if ((hasLngLat as Feature).geometry) {
        return (hasLngLat as Feature<Point>).geometry.coordinates;
    }
    throw new Error("Received object does not have lng lat coordinates");
};
