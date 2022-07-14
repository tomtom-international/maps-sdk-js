import { RevGeoAddressProps } from "@anw/go-sdk-js/core";
import { Feature, Point } from "geojson";

import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { callService } from "../shared/ServiceTemplate";
import { ReverseGeocodingTemplate, reverseGeocodingTemplate } from "./ReverseGeocodingTemplate";

export type ReverseGeocodingResponse = Feature<Point, RevGeoAddressProps>;

/**
 * Sometimes you need to translate a coordinate into a human-readable street address.
 * This is often used in tracking applications that receive a GPS feed from a device or asset and need to obtain the corresponding address.
 * The reverse geocoding endpoint returns the address information described in the Reverse Geocoding API documentation on the Developer Portal.
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 * @returns Promise<ReverseGeocodingResponse>
 */
export const reverseGeocode = async (
    params: ReverseGeocodingParams,
    customTemplate?: Partial<ReverseGeocodingTemplate>
): Promise<ReverseGeocodingResponse> => {
    return callService(params, { ...reverseGeocodingTemplate, ...customTemplate });
};

export default reverseGeocode;
