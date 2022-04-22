import axios from "axios";
import { Address, getLngLatArray, HasLngLat } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";

/**
 * The TomTom Reverse Geocoding API gives users a tool to translate a coordinate (for example: 37.786505, -122.3862)
 * into a human-understandable street address, street element, or geography.
 *
 * @param position Longitude and latitude data in one of the supported formats.
 * @param options
 * @see https://developer.tomtom.com/search-api/documentation/reverse-geocoding-service/reverse-geocode
 */
export const reverseGeocode = async (position: HasLngLat, options?: ReverseGeocodingOptions): Promise<Address> => {
    const lngLatArray = getLngLatArray(position);
    return new Promise((resolve, reject) => {
        axios
            .get(`/${lngLatArray[1]},${lngLatArray[0]}.json`, {
                baseURL: "https://api.tomtom.com/search/2/reverseGeocode",
                params: {
                    key: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
                }
            })
            .then(
                (resolved) => resolve(resolved.data?.addresses[0]?.address),
                (rejected) => reject(rejected)
            );
    });
};
