require("isomorphic-fetch");

import { GOSDKConfig } from "core/src";
import reverseGeocode from "../ReverseGeocoding";

describe("Reverse Geocoding integration test without API key", () => {
    test("Reverse Geocoding integration test without API key", async () => {
        await expect(reverseGeocode([5.72884, 52.33499])).rejects.toEqual(403);
    });
});

describe("Reverse Geocoding integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({
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

    test("Reverse geocoding with house number input", async () => {
        // Point by Singel 117:
        const result = await reverseGeocode([4.89081, 52.37552]);

        expect(result?.properties?.streetNumber).toStrictEqual("117");
        expect(result?.properties?.sideOfStreet).toBeUndefined();
        expect(result?.properties?.offsetPosition).toBeUndefined();

        // Point by Singel 117, but passing 115 number:
        const resultWithNumber = await reverseGeocode([4.89081, 52.37552], {
            number: "115"
        });
        expect(resultWithNumber?.properties?.streetNumber).toStrictEqual("115");
        expect(resultWithNumber?.properties?.sideOfStreet).toStrictEqual("R");
        expect(resultWithNumber?.properties?.offsetPosition).toBeDefined();

        // Point around Langestraat 94, building on the left side:
        const resultWithNumberOtherSide = await reverseGeocode([4.89021, 52.37562], {
            number: "94"
        });
        expect(resultWithNumberOtherSide?.properties?.streetNumber).toStrictEqual("94");
        expect(resultWithNumberOtherSide?.properties?.sideOfStreet).toStrictEqual("L");
        expect(resultWithNumberOtherSide?.properties?.offsetPosition).toBeDefined();
    });

    test("Reverse geocoding from the sea with small radius", async () => {
        const result = await reverseGeocode([4.49112, 52.35937], {
            radius: 10
        });
        expect(result.properties.country).toBeUndefined();
    });

    test("Reverse geocoding from the sea with default radius which yields a result", async () => {
        const result = await reverseGeocode([4.49112, 52.35937]);
        expect(result.properties.country).toBeDefined();
    });

    test("Reverse geocoding with specified road uses", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], {
            returnRoadUse: true,
            roadUse: ["Terminal", "LocalStreet"]
        });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with most options as non defaults", async () => {
        const result = await reverseGeocode([5.72884, 52.33499], {
            allowFreeformNewline: true,
            heading: 90,
            language: "nl-NL",
            mapcodes: ["Local", "International"],
            number: "10",
            radius: 50000,
            returnRoadUse: true,
            roadUse: ["Ramp"]
        });
        expect(result).toBeDefined();
    });
});
