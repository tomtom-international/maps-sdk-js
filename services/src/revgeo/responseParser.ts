import { generateId, getPositionStrict, toPointGeometry } from '@tomtom-org/maps-sdk/core';
import { apiToGeoJSONBBox, csvLatLngToPosition } from '../shared/geometry';
import type { ReverseGeocodingResponse } from './reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from './types/apiTypes';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (
    apiResponse: ReverseGeocodingResponseAPI,
    params: ReverseGeocodingParams,
): ReverseGeocodingResponse => {
    const firstApiResult = apiResponse.addresses[0];
    const { boundingBox, sideOfStreet, offsetPosition, ...address } = firstApiResult?.address || {};
    return {
        type: 'Feature',
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        geometry: toPointGeometry(getPositionStrict(params.position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        id: generateId(),
        ...(firstApiResult && {
            properties: {
                type: firstApiResult?.entityType ? 'Geography' : !address.streetNumber ? 'Street' : 'Point Address',
                address,
                ...(firstApiResult.dataSources && { dataSources: firstApiResult.dataSources }),
                ...(firstApiResult.mapcodes && { mapcodes: firstApiResult.mapcodes }),
                ...(sideOfStreet && { sideOfStreet }),
                ...(offsetPosition && { offsetPosition: csvLatLngToPosition(offsetPosition) }),
                // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
                originalPosition: csvLatLngToPosition(firstApiResult.position),
            },
        }),
    };
};
