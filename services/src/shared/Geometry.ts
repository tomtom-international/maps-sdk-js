import { Position } from "geojson";

export const csvLatLngToPosition = (csv: string): Position => {
    const splitLatLng = csv.split(",");
    return [Number(splitLatLng[1]), Number(splitLatLng[0])];
};
