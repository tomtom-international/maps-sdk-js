import { Feature, Point, Polygon, Position } from "geojson";
import { RevGeoAddressProps, toPointFeature } from "core";

import { csvLatLngToPosition } from "../shared/Geometry";

export const bboxToPolygon = (apiBBox: { southWest: string; northEast: string }): Polygon => {
    const westSouth = csvLatLngToPosition(apiBBox.southWest);
    const eastNorth = csvLatLngToPosition(apiBBox.northEast);
    const westNorth = [westSouth[0], eastNorth[1]];
    const eastSouth = [eastNorth[0], westSouth[1]];
    return { type: "Polygon", coordinates: [[westSouth, eastSouth, eastNorth, westNorth, westSouth]] };
};

export const parseResponse = (requestLngLat: Position, apiResponse: any): Feature<Point, RevGeoAddressProps> => {
    const responseAddress = apiResponse.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...toPointFeature(requestLngLat),
        properties: {
            ...responseAddress,
            // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
            originalPosition: csvLatLngToPosition(apiResponse.position),
            ...(responseAddress.boundingBox && { boundingBox: bboxToPolygon(responseAddress.boundingBox) })
        }
    };
};
