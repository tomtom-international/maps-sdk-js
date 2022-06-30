import { RevGeoAddressProps } from "core";
import { Feature, Point } from "geojson";

import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { callService } from "../shared/ServiceTemplate";
import { ReverseGeocodingTemplate, reverseGeocodingTemplate } from "./ReverseGeocodingTemplate";

export type ReverseGeocodingResponse = Feature<Point, RevGeoAddressProps>;

/**
 * The TomTom Reverse Geocoding API gives users a tool to translate a coordinate (for example: 37.786505, -122.3862)
 * into a human-understandable street address, street element, or geography.
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (
    params: ReverseGeocodingParams,
    customTemplate?: Partial<ReverseGeocodingTemplate>
): Promise<ReverseGeocodingResponse> => {
    return callService(params, { ...reverseGeocodingTemplate, ...customTemplate });
};

export default reverseGeocode;
