import { poiClassificationFromIconID } from "../poiIconIDMapping";

describe("classification", () => {
    test("simple call", () => {
        expect(poiClassificationFromIconID(320)).toEqual("CAFE_PUB");
    });
});
