import { getLngLatArray, HasLngLat, RevGeoAddressProps } from "core";
import { Feature, Point } from "geojson";

import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";
import { parseRevGeoResponse } from "./ResponseParser";
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
    const request = buildRevGeoRequest(lngLatArray, options);
    const json = await fetchJson<any>(request.toString());
    return parseRevGeoResponse(lngLatArray, json.addresses[0], options);
};

export default reverseGeocode;
