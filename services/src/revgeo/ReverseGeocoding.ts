import { getLngLatArray, HasLngLat, RevGeoAddressProps } from "core";
import { Feature, Point } from "geojson";

import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";
import { parseResponse } from "./ResponseParser";
import { buildRevGeoRequest } from "./RequestBuilder";
import { fetchJson } from "../shared/Fetch";

export type ReverseGeocodingResponse = Feature<Point, RevGeoAddressProps>;

/**
 * The TomTom Reverse Geocoding API gives users a tool to translate a coordinate (for example: 37.786505, -122.3862)
 * into a human-understandable street address, street element, or geography.
 *
 * @param position Longitude and latitude data in one of the supported formats.
 * @param options Optional parameters.
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (
    position: HasLngLat,
    options?: ReverseGeocodingOptions
): Promise<ReverseGeocodingResponse> => {
    const lngLatArray = getLngLatArray(position);
    let request = buildRevGeoRequest(lngLatArray, options);
    if (options?.updateRequest) {
        request = options.updateRequest(request);
    }
    const json = await fetchJson<any>(request.toString());
    const response = parseResponse(lngLatArray, json.addresses[0]);
    return options?.updateResponse ? options.updateResponse(response) : response;
};

export default reverseGeocode;
