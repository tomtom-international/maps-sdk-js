import { Polygon } from "geojson";
import { getLngLatArray, toPointFeature } from "core";

import { csvLatLngToPosition } from "../shared/Geometry";
import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";

const bboxToPolygon = (apiBBox: { southWest: string; northEast: string }): Polygon => {
    const westSouth = csvLatLngToPosition(apiBBox.southWest);
    const eastNorth = csvLatLngToPosition(apiBBox.northEast);
    const westNorth = [westSouth[0], eastNorth[1]];
    const eastSouth = [eastNorth[0], westSouth[1]];
    return { type: "Polygon", coordinates: [[westSouth, eastSouth, eastNorth, westNorth, westSouth]] };
};

export const parseRevGeoResponse = (params: ReverseGeocodingParams, apiResponse: any): ReverseGeocodingResponse => {
    const pointFeature = toPointFeature(getLngLatArray(params.position));
    const response = apiResponse.addresses[0];
    const address = response.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...pointFeature,
        properties: {
            ...address,
            // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
            originalPosition: csvLatLngToPosition(response.position),
            ...(address.boundingBox && { boundingBox: bboxToPolygon(address.boundingBox) })
        }
    };
};
