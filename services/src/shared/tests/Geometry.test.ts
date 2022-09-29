import { apiToGeoJSONBBox } from "../Geometry";

describe("Geometry tests", () => {
    test("API to GeoJSON bounding boxes", () => {
        expect(
            apiToGeoJSONBBox({
                topLeftPoint: {
                    lat: 52.44179,
                    lon: 4.80845
                },
                btmRightPoint: {
                    lat: 52.44009,
                    lon: 4.81063
                }
            })
        ).toStrictEqual([4.80845, 52.44009, 4.81063, 52.44179]);

        expect(
            apiToGeoJSONBBox({
                southWest: "52.44009,4.80845",
                northEast: "52.44179,4.81063"
            })
        ).toStrictEqual([4.80845, 52.44009, 4.81063, 52.44179]);
    });
});
