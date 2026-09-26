import type { GeographyType } from '@tomtom-org/maps-sdk/core';
import { getPositionStrict } from '@tomtom-org/maps-sdk/core';
import { isNil } from 'lodash-es';
import type { GetObject } from '../shared';
import { resolvePlacesEndpointUrl } from '../shared/request/placesEndpoint';
import { buildCommonServiceRequestHeaders } from '../shared/request/requestBuildingUtils';
import type { ReverseGeocodingAreaTypeAPI } from './types/apiTypes';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

// Maps the SDK's public GeographyType values to the API's `areaTypes` values.
export const AREA_TYPE_BY_GEOGRAPHY_TYPE: Record<GeographyType, ReverseGeocodingAreaTypeAPI> = {
    Country: 'country',
    CountrySubdivision: 'countrySubdivision',
    CountrySecondarySubdivision: 'countrySecondarySubdivision',
    CountryTertiarySubdivision: 'countryTertiarySubdivision',
    Municipality: 'municipality',
    MunicipalitySubdivision: 'municipalitySubdivision',
    MunicipalitySecondarySubdivision: 'municipalitySecondarySubdivision',
    Neighbourhood: 'neighborhood',
    PostalCodeArea: 'postalCode',
};

// Requests every result field the SDK's response parser understands, so callers get a
// complete place without having to specify a projection themselves.
const DEFAULT_ATTRIBUTES = 'results(*)';

const buildUrlBasePath = (params: ReverseGeocodingParams): string => resolvePlacesEndpointUrl(params, 'reverseGeocode');

/**
 * Default function for building a reverse geocoding request from {@link ReverseGeocodingParams}
 * @param params The reverse geocoding parameters, with global configuration already merged into them.
 */
export const buildRevGeoRequest = (params: ReverseGeocodingParams): GetObject => {
    const [lng, lat] = getPositionStrict(params.position);
    const url = new URL(buildUrlBasePath(params));
    const urlParams = url.searchParams;
    urlParams.append('position', `${lng},${lat}`);

    !isNil(params.radiusMeters) && urlParams.append('radiusInMeters', String(params.radiusMeters));
    params.geographyType &&
        urlParams.append(
            'areaTypes',
            params.geographyType.map((geographyType) => AREA_TYPE_BY_GEOGRAPHY_TYPE[geographyType]).join(','),
        );
    !isNil(params.heading) && urlParams.append('vehicleHeadingInDegrees', String(params.heading));
    params.view && urlParams.append('geopoliticalView', params.view);

    return {
        url,
        headers: {
            ...buildCommonServiceRequestHeaders(params),
            Attributes: DEFAULT_ATTRIBUTES,
        },
    };
};
