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
        const result = await reverseGeocode([5.72884, 52.33499]);
        expect(result).toBeDefined();
    });

    test("Localized reverse geocoding", async () => {
        const result = await reverseGeocode([-0.12681, 51.50054], { language: "es-ES" });
        expect(result).toBeDefined();
        expect(result.properties.country).toStrictEqual("Reino Unido");
    });

    test("Country reverse geocoding", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], { entityType: "Country" });
        expect(result).toBeDefined();
        expect(result.properties.streetName).toBeUndefined();
    });

    test("Reverse geocoding with international mapcodes", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], { mapcodes: "International" });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with all mapcode types", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], {
            mapcodes: ["Local", "International", "Alternative"]
        });
        expect(result).toBeDefined();
    });
});
