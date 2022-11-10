import { Place } from "@anw/go-sdk-js/core";
import { getImageIDForPlace } from "../GeoJSONPlaces";

describe("Get Image ID for a given Place tests", () => {
    test("Get Image ID for a given Place", () => {
        expect(getImageIDForPlace({ properties: {} } as Place)).toStrictEqual("default_pin");
        expect(
            getImageIDForPlace({ properties: { poi: { classifications: [{ code: "HOSPITAL" }] } } } as Place)
        ).toStrictEqual("157_pin");
        expect(
            getImageIDForPlace({ properties: { poi: { classifications: [{ code: "UNSUPPORTED" }] } } } as Place)
        ).toStrictEqual("default_pin");
    });
});
