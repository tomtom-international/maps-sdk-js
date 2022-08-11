import { polygonToBtmRightBBox, bboxToPolygon } from "../Geometry";

describe("Geometry tests", () => {
    test("bbox to polygon then to bbox again", () => {
        expect(
            polygonToBtmRightBBox(
                bboxToPolygon({
                    topLeftPoint: {
                        lat: 52.44179,
                        lon: 4.80845
                    },
                    btmRightPoint: {
                        lat: 52.44009,
                        lon: 4.81063
                    }
                })
            )
        ).toEqual([52.44009, 4.81063]);
    });
});
