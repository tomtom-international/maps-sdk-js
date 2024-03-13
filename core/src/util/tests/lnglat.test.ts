import { getPosition, getPositionStrict, toPointFeature } from "../lnglat";

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

describe("getPosition tests", () => {
    test("is incorrect", () => {
        expect(getPosition(undefined as never)).toBeNull();
        expect(getPosition({ random: "blah" } as never)).toBeNull();

        expect(() => getPositionStrict(undefined as never)).toThrow();
        expect(() => getPositionStrict({ random: "blah" } as never)).toThrow();
    });
    test("is coordinates", () => {
        expect(getPosition([52.467, 4.872])).toEqual([52.467, 4.872]);
        expect(getPositionStrict([52.467, 4.872])).toEqual([52.467, 4.872]);
    });
    test("is point", () => {
        expect(
            getPosition({
                type: "Point",
                coordinates: [52.467, 4.872]
            })
        ).toEqual([52.467, 4.872]);
    });
    test("is feature", () => {
        expect(
            getPosition({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [52.467, 4.872]
                },
                properties: {}
            })
        ).toEqual([52.467, 4.872]);
    });
});
