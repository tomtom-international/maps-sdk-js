import axios from "axios";
import { Address } from "core/src";
import { ReverseGeocodingOptions } from "./ReverseGeocodingOptions";

export const reverseGeocode = async (options: ReverseGeocodingOptions): Promise<Address> =>
    axios.get("/52.33499,5.72884.json", {
        baseURL: "https://api.tomtom.com/search/2/reverseGeocode",
        params: {
            key: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
        }
    });
