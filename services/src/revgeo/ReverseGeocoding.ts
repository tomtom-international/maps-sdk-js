import { RevGeoAddressProps, Location } from "@anw/go-sdk-js/core";

import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { callService } from "../shared/ServiceTemplate";
import { ReverseGeocodingTemplate, reverseGeocodingTemplate } from "./ReverseGeocodingTemplate";

/**
 * @group Search
 * @category Reverse Geocoding
 */
export type ReverseGeocodingResponse = Location<RevGeoAddressProps>;

/**
 * Sometimes you need to translate a coordinate into a human-readable street address.
 * This is often used in tracking applications that receive a GPS feed from a device or asset and need to obtain the corresponding address.
 * The reverse geocoding endpoint returns the address information described in the Reverse Geocoding API documentation on the Developer Portal.
 * @group Search
 * @category Reverse Geocoding
 * @param params Mandatory and optional parameters, with the global configuration automatically included.
 * @param customTemplate Advanced optional parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (
    params: ReverseGeocodingParams,
    customTemplate?: Partial<ReverseGeocodingTemplate>
): Promise<ReverseGeocodingResponse> => {
    return callService(params, { ...reverseGeocodingTemplate, ...customTemplate });
};

export default reverseGeocode;
