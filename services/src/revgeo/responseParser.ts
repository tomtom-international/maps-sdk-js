import type { GeographyType } from '@tomtom-org/maps-sdk/core';
import { generateId, getPositionStrict, toPointGeometry } from '@tomtom-org/maps-sdk/core';
import { toIso3 } from '../shared/iso2ToIso3';
import { AREA_TYPE_BY_GEOGRAPHY_TYPE } from './requestBuilder';
import type { ReverseGeocodingResponse } from './reverseGeocoding';
import type {
    ReverseGeocodingAddressAPI,
    ReverseGeocodingAreaTypeAPI,
    ReverseGeocodingResponseAPI,
    ReverseGeocodingResultTypeAPI,
} from './types/apiTypes';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

const PLACE_TYPE_BY_RESULT_TYPE: Record<ReverseGeocodingResultTypeAPI, 'Street' | 'Geography' | 'Point Address'> = {
    street: 'Street',
    area: 'Geography',
    address: 'Point Address',
};

const GEOGRAPHY_TYPE_BY_AREA_TYPE = Object.fromEntries(
    Object.entries(AREA_TYPE_BY_GEOGRAPHY_TYPE).map(([geographyType, areaType]) => [areaType, geographyType]),
) as Record<ReverseGeocodingAreaTypeAPI, GeographyType>;

// Renames the handful of v2 address fields whose SDK-facing name differs from the API's, and
// derives `countryCodeISO3`, which v2 does not return but the v1 search services do. Same
// derivation the routing response parser applies to its own `countryCodeIso2` fields.
const mapAddress = (apiAddress: ReverseGeocodingAddressAPI) => {
    const { street, houseNumber, countryCodeIso2, ...rest } = apiAddress;
    return {
        ...rest,
        ...(street && { streetName: street }),
        ...(houseNumber && { streetNumber: houseNumber }),
        ...(countryCodeIso2 && { countryCode: countryCodeIso2, countryCodeISO3: toIso3(countryCodeIso2) }),
    };
};

/**
 * Default method for parsing reverse geocoding request from {@link ReverseGeocodingResponse}
 * @param params
 * @param apiResponse
 */
export const parseRevGeoResponse = (
    apiResponse: ReverseGeocodingResponseAPI,
    params: ReverseGeocodingParams,
): ReverseGeocodingResponse => {
    const firstResult = apiResponse.results[0];
    return {
        type: 'Feature',
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        geometry: toPointGeometry(getPositionStrict(params.position)),
        id: firstResult?.id ?? generateId(),
        ...(firstResult && {
            properties: {
                type: PLACE_TYPE_BY_RESULT_TYPE[firstResult.type],
                address: { freeformAddress: firstResult.title, ...mapAddress(firstResult.address) },
                ...(firstResult.areaType && {
                    geographyType: [GEOGRAPHY_TYPE_BY_AREA_TYPE[firstResult.areaType]],
                    // v2 has no `dataSources`, but for an area result its `id` is the geometry ID.
                    // Surfacing it here keeps `getGeometryData` / `GeometriesModule` reachable from a
                    // reverse geocoded geography, as it is from a search result.
                    dataSources: { geometry: { id: firstResult.id } },
                }),
                // v2 calls them access points and places them on the road network; they are the
                // same entrances the search services return, minus the main/minor classification.
                ...(firstResult.accessPoints?.length && {
                    entryPoints: firstResult.accessPoints.map((accessPoint) => ({
                        position: accessPoint.position.coordinates,
                    })),
                }),
                // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
                originalPosition: firstResult.position.coordinates,
            },
        }),
    };
};
