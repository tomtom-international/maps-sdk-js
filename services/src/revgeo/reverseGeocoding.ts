import type { Place, RevGeoAddressProps } from '@cet/maps-sdk-js/core';
import { callService } from '../shared/serviceTemplate';
import type { ReverseGeocodingTemplate } from './reverseGeocodingTemplate';
import { reverseGeocodingTemplate } from './reverseGeocodingTemplate';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

export type ReverseGeocodingResponse = Place<RevGeoAddressProps>;

/**
 * Sometimes you need to translate a coordinate into a human-readable street address.
 * This is often used in tracking applications that receive a GPS feed from a device or asset and need to obtain the corresponding address.
 * The reverse geocoding endpoint returns the address information described in the Reverse Geocoding API documentation on the Developer Portal.
 * @param params Mandatory and optional parameters, with the global configuration automatically included.
 * @param customTemplate Advanced optional parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (
    params: ReverseGeocodingParams,
    customTemplate?: Partial<ReverseGeocodingTemplate>,
): Promise<ReverseGeocodingResponse> =>
    callService(params, { ...reverseGeocodingTemplate, ...customTemplate }, 'ReverseGeocode');

export default reverseGeocode;
