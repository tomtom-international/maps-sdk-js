import { GOSDKConfig } from "@anw/go-sdk-js/core";

import { example0SDKResponse } from "./RevGeoTest.data";
import reverseGeocode from "../ReverseGeocoding";
import { parseRevGeoResponse } from "../ResponseParser";

describe("Reverse Geocoding integration test without API key", () => {
    test("Reverse Geocoding integration test without API key", async () => {
        await expect(reverseGeocode({ position: [5.72884, 52.33499] })).rejects.toEqual(403);
    });
});

describe("Reverse Geocoding integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({
            apiKey: "XVxgvGPnXxuAHlFcKu1mBTGupVwhVlOE"
        });
    });

    test("Default reverse geocoding", async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499] });
        expect(result).toEqual(expect.objectContaining(example0SDKResponse));
    });

    test("Localized reverse geocoding", async () => {
        const result = await reverseGeocode({ position: [-0.12681, 51.50054], language: "es-ES" });
        expect(result).toBeDefined();
        expect(result.properties.address.country).toStrictEqual("Reino Unido");
    });

    test("Country reverse geocoding", async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], geographyType: ["Country"] });
        expect(result).toBeDefined();
        expect(result.properties.address.streetName).toBeUndefined();
        expect(result.properties.type).toStrictEqual("Geography");
    });

    test("Reverse geocoding with international mapcodes", async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], mapcodes: "International" });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with all mapcode types", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            mapcodes: ["Local", "International", "Alternative"]
        });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with house number input", async () => {
        // Point by Singel 117:
        const result = await reverseGeocode({ position: [4.89081, 52.37552] });

        expect(result?.properties?.address.streetNumber).toStrictEqual("117");
        expect(result?.properties?.address.sideOfStreet).toBeUndefined();
        expect(result?.properties?.address.offsetPosition).toBeUndefined();

        // Point by Singel 117, but passing 115 number:
        const resultWithNumber = await reverseGeocode({ position: [4.89081, 52.37552], number: "115" });
        expect(resultWithNumber?.properties?.address.streetNumber).toStrictEqual("115");
        expect(resultWithNumber?.properties?.address.sideOfStreet).toStrictEqual("R");
        expect(resultWithNumber?.properties?.address.offsetPosition).toBeDefined();

        // Point around Langestraat 94, building on the left side:
        const resultWithNumberOtherSide = await reverseGeocode({ position: [4.89021, 52.37562], number: "94" });
        expect(resultWithNumberOtherSide?.properties?.address.streetNumber).toStrictEqual("94");
        expect(resultWithNumberOtherSide?.properties?.address.sideOfStreet).toStrictEqual("L");
        expect(resultWithNumberOtherSide?.properties?.address.offsetPosition).toBeDefined();
    });

    test("Reverse geocoding from the sea with small radius", async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937], radius: 10 });
        expect(result.properties.address.country).toBeUndefined();
    });

    test("Reverse geocoding from the sea with default radius which yields a result", async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937] });
        expect(result.properties.address.country).toBeDefined();
    });

    test("Reverse geocoding with specified road uses", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            returnRoadUse: true,
            roadUse: ["Terminal", "LocalStreet"]
        });
        expect(result).toBeDefined();
    });

    test("Reverse geocoding with most options as non defaults", async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
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

    test("Reverse geocoding with template response override", async () => {
        const result = await reverseGeocode(
            { position: [-0.12681, 51.50054] },
            {
                parseResponse: (params, response) => ({
                    ...parseRevGeoResponse(params, response),
                    newField: "test"
                })
            }
        );
        expect(result).toStrictEqual({ ...result, newField: "test" });
    });

    test("Invalid position: latitude/longitude out of range.", async () => {
        await expect(reverseGeocode({position: [-91,180]})).rejects.toEqual(400);
    });

    test("Verify missing latitude & longitude position", async () => {
        await expect(reverseGeocode({position: []})).rejects.toEqual(400);
    });

    test("Verify missing latitude or longitude position", async () => {
        await expect(reverseGeocode({position: [90]})).rejects.toEqual(400);
    });

});
