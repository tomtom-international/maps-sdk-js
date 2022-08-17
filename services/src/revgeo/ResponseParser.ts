import { getLngLatArray, toPointFeature } from "@anw/go-sdk-js/core";

import { csvLatLngToPosition, bboxToPolygon } from "../shared/Geometry";
import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @group Search
 * @category Reverse Geocoding
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (params: ReverseGeocodingParams, apiResponse: any): ReverseGeocodingResponse => {
    const pointFeature = toPointFeature(getLngLatArray(params.position));
    const response = apiResponse.addresses[0];
    const address = response.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...pointFeature,
        properties: {
            type: response.entityType ? "Geography" : !address.streetNumber ? "Street" : "Point Address",
            address: {
                ...address,
                // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
                originalPosition: csvLatLngToPosition(response.position),
                ...(address.boundingBox && { boundingBox: bboxToPolygon(address.boundingBox) })
            }
        }
    };
};
