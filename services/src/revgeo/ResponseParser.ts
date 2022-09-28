import { getLngLatArray, toPointFeature } from "@anw/go-sdk-js/core";
import { csvLatLngToPosition, apiToGeoJSONBBox } from "../shared/Geometry";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";
import { ReverseGeocodingResponseAPI } from "./types/APITypes";

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @group Reverse Geocoding
 * @category Functions
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (
    apiResponse: ReverseGeocodingResponseAPI,
    params: ReverseGeocodingParams
): ReverseGeocodingResponse => {
    const pointFeature = toPointFeature(getLngLatArray(params.position));
    const firstAPIResult = apiResponse.addresses[0];
    const { boundingBox, sideOfStreet, offsetPosition, ...address } = firstAPIResult.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...pointFeature,
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        properties: {
            type: firstAPIResult.entityType ? "Geography" : !address.streetNumber ? "Street" : "Point Address",
            address,
            ...(firstAPIResult.dataSources && { dataSources: firstAPIResult.dataSources }),
            ...(firstAPIResult.mapcodes && { mapcodes: firstAPIResult.mapcodes }),
            ...(sideOfStreet && { sideOfStreet }),
            ...(offsetPosition && { offsetPosition: csvLatLngToPosition(offsetPosition) }),
            // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
            originalPosition: csvLatLngToPosition(firstAPIResult.position)
        }
    };
};
