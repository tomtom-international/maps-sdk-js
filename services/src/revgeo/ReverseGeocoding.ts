import { Feature, Point } from "geojson";
import { getLngLatArray, HasLngLat, RevGeoAddressProps } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";
import { parseResponse } from "./ResponseParser";
import { buildRevGeoRequest } from "./RequestBuilder";
import { fetchJson } from "../shared/Fetch";

/**
 * The TomTom Reverse Geocoding API gives users a tool to translate a coordinate (for example: 37.786505, -122.3862)
 * into a human-understandable street address, street element, or geography.
 *
 * @param position Longitude and latitude data in one of the supported formats.
 * @param options
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (
    position: HasLngLat,
    options?: ReverseGeocodingOptions
): Promise<Feature<Point, RevGeoAddressProps>> => {
    const lngLatArray = getLngLatArray(position);
    return new Promise((resolve, reject) => {
        fetchJson<any>(buildRevGeoRequest(lngLatArray, options).toString())
            .then((json) => resolve(parseResponse(lngLatArray, json.addresses[0])))
            .catch((error) => reject(error));
    });
};

export default reverseGeocode;
