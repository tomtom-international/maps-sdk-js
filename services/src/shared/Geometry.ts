import { Position } from "geojson";

/**
 * @ignore
 * @param csv
 */
export const csvLatLngToPosition = (csv: string): Position => {
    const splitLatLng = csv.split(",");
    return [Number(splitLatLng[1]), Number(splitLatLng[0])];
};
