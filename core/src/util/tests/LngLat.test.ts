import { toPointFeature } from "../LngLat";

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
