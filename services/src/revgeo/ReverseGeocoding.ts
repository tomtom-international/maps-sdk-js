import { Feature, Point } from "geojson";
import { getLngLatArray, HasLngLat, mergeFromGlobal, RevGeoAddressProps } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";
import { parseResponse } from "./ResponseParser";
import { arrayToCSV } from "../shared/Arrays";

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
    const mergedOptions = mergeFromGlobal(options);
    const lngLatArray = getLngLatArray(position);
    const url = new URL(`${mergedOptions.baseURL}search/2/reverseGeocode/${lngLatArray[1]},${lngLatArray[0]}.json`);
    const urlParams = url.searchParams;
    urlParams.append("key", mergedOptions.apiKey as string);
    mergedOptions.allowFreeformNewline &&
        urlParams.append("allowFreeformNewline", String(mergedOptions.allowFreeformNewline));
    mergedOptions.entityType && urlParams.append("entityType", mergedOptions.entityType as string);
    mergedOptions.mapcodes && urlParams.append("mapcodes", arrayToCSV(mergedOptions.mapcodes));

    return new Promise((resolve, reject) => {
        fetch(url.toString())
            .then((response) => response.json().then((json) => resolve(parseResponse(lngLatArray, json.addresses[0]))))
            .catch((error) => reject(error));
    });
};

export default reverseGeocode;
