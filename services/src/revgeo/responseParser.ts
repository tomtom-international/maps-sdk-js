import { getPositionStrict, toPointFeature } from "@anw/maps-sdk-js/core";
import { apiToGeoJSONBBox, csvLatLngToPosition } from "../shared/geometry";
import type { ReverseGeocodingParams } from "./types/reverseGeocodingParams";
import type { ReverseGeocodingResponse } from "./reverseGeocoding";
import type { ReverseGeocodingResponseAPI } from "./types/apiTypes";

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (
    apiResponse: ReverseGeocodingResponseAPI,
    params: ReverseGeocodingParams
): ReverseGeocodingResponse => {
    const pointFeature = toPointFeature(getPositionStrict(params.position));
    const firstAPIResult = apiResponse.addresses[0];
    const { boundingBox, sideOfStreet, offsetPosition, ...address } = firstAPIResult.address;
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...pointFeature,
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        id: `random_${Math.random()}`,
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
