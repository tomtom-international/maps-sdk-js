require("isomorphic-fetch");

import { GOSDKConfig } from "core/src";
import reverseGeocode from "../ReverseGeocoding";

describe("Reverse Geocoding integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.add({
            apiKey: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
        });
    });

    test("Default reverse geocoding", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], { allowFreeformNewline: true });
        console.log(result);
        expect(result).toBeDefined();
    });

    test("Country reverse geocoding", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], { entityType: "Country" });
        console.log(result);
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with international mapcodes", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], { mapcodes: "International" });
        console.log(result);
        expect(result).toBeDefined();
    });
});
