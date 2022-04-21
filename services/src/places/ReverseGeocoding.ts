import axios from "axios";
import { Address } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";

export const reverseGeocode = async (options: ReverseGeocodingOptions): Promise<Address> =>
    new Promise((resolve, reject) => {
        axios
            .get("/52.33499,5.72884.json", {
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
