import { Feature, Point } from "geojson";
import { AddressProperties, getLngLatArray, HasLngLat, mergeFromGlobal } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";

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
): Promise<Feature<Point, AddressProperties>> => {
    options = mergeFromGlobal(options);
    const lngLatArray = getLngLatArray(position);
    return new Promise((resolve, reject) => {
        const url = new URL(`${options?.baseURL}search/2/reverseGeocode/${lngLatArray[1]},${lngLatArray[0]}.json`);
        url.searchParams.append("key", <string>options?.apiKey);
        fetch(url.toString())
            .then((response) => response.json().then((json) => resolve(json.addresses[0]?.address)))
            .catch((error) => reject(error));
    });
};
