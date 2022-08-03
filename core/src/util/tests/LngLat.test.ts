import {getLngLatArray, toPointFeature} from "../LngLat";

describe("toPointFeature tests", () => {
    test("passing LngLat to toPointFeature", () => {
        expect(toPointFeature([52.467, 4.872])).toEqual({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [52.467, 4.872]
            },
            properties: {}
        });
    });
});

describe("getLngLatArray tests", () => {
    test("is coordinates", () => {
        expect(getLngLatArray([52.467, 4.872])).toEqual([52.467, 4.872]);
    });
    test("is point", () => {
        expect(getLngLatArray({
            type: "Point",
            coordinates: [52.467, 4.872]
        })).toEqual([52.467, 4.872]);
    });
    test("is feature", () => {
        expect(getLngLatArray({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [52.467, 4.872]
            },
            properties: {}
        })).toEqual([52.467, 4.872]);
    });
});
