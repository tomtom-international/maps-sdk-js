import omit from "lodash/omit";

import { getLngLatArray, toPointFeature } from "@anw/go-sdk-js/core";
import { csvLatLngToPosition, bboxToPolygon } from "../shared/Geometry";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";
import { ReverseGeocodingResponseAPI } from "./types/APITypes";

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @group Search
 * @category Reverse Geocoding
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (
    apiResponse: ReverseGeocodingResponseAPI,
    params: ReverseGeocodingParams
): ReverseGeocodingResponse => {
    const pointFeature = toPointFeature(getLngLatArray(params.position));
    const firstAPIResult = apiResponse.addresses[0];
    const address = firstAPIResult.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...pointFeature,
        properties: {
            type: firstAPIResult.entityType ? "Geography" : !address.streetNumber ? "Street" : "Point Address",
            address: {
                ...omit(address, "boundingBox", "sideOfStreet", "offsetPosition")
            },
            ...(firstAPIResult.dataSources && { dataSources: firstAPIResult.dataSources }),
            ...(firstAPIResult.mapcodes && { mapcodes: firstAPIResult.mapcodes }),
            ...(address.boundingBox && { boundingBox: bboxToPolygon(address.boundingBox) }),
            ...(address.sideOfStreet && { sideOfStreet: address.sideOfStreet }),
            ...(address.offsetPosition && { offsetPosition: csvLatLngToPosition(address.offsetPosition) }),
            // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
            originalPosition: csvLatLngToPosition(firstAPIResult.position)
        }
    };
};
