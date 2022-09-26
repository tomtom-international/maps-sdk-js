import { csvLatLngToPosition } from "../Geometry";

describe("CSV Lat Lng to Position tests", () => {
    test("CSV Lat Lng to Position tests", () => {
        expect(csvLatLngToPosition("50.1, 2.4")).toStrictEqual([2.4, 50.1]);
        expect(csvLatLngToPosition("-50.0000, 2.4")).toStrictEqual([2.4, -50]);
        expect(csvLatLngToPosition("0.0, 2.4")).toStrictEqual([2.4, 0]);
        expect(csvLatLngToPosition("50.129931231, -92.40")).toStrictEqual([-92.4, 50.129931231]);
    });
});
