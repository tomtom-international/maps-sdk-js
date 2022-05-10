import { Feature, Point, Position } from "geojson";
import { getLngLatArray, HasLngLat, mergeFromGlobal, RevGeoAddressProps, toPointFeature } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";

export const parseResponse = (requestLngLat: Position, apiResponseJSON: any): Feature<Point, RevGeoAddressProps> => {
    const addressLatLng = (apiResponseJSON.position as string).split(",").map((coordStr) => Number(coordStr));
    return {
        // The requested coordinates are the primary ones, and set as the GeoJSON Feature geometry:
        ...toPointFeature(requestLngLat),
        properties: {
            // The reverse geocoded coordinates are secondary and set in the GeoJSON properties:
            lngLat: [addressLatLng[1], addressLatLng[0]],
            ...apiResponseJSON.address
        } as RevGeoAddressProps
    };
};

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
    options = mergeFromGlobal(options);
    const lngLatArray = getLngLatArray(position);
    return new Promise((resolve, reject) => {
        const url = new URL(`${options?.baseURL}search/2/reverseGeocode/${lngLatArray[1]},${lngLatArray[0]}.json`);
        url.searchParams.append("key", <string>options?.apiKey);
        fetch(url.toString())
            .then((response) => response.json().then((json) => resolve(parseResponse(lngLatArray, json.addresses[0]))))
            .catch((error) => reject(error));
    });
};
