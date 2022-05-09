require("isomorphic-fetch");

import { GOSDKConfig } from "core/src";
import { reverseGeocode } from "../ReverseGeocoding";

describe("ReverseGeocode integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.add({
            apiKey: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
        });
    });

    test("Basic reverse geocoding test", async () => {
        const result = await reverseGeocode([5.72884, 52.33499]);
        console.log(result);
        expect(result).toBeDefined();
    });
});
