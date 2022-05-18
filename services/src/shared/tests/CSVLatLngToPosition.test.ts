import { csvLatLngToPosition } from "../Geometry";

describe("CSV Lat Lng to Position tests", () => {
    test("CSV Lat Lng to Position tests", async () => {
        expect(csvLatLngToPosition("50.1, 2.4")).toStrictEqual([2.4, 50.1]);
        expect(csvLatLngToPosition("-50.0, 2.4")).toStrictEqual([2.4, -50.0]);
        expect(csvLatLngToPosition("50.129931231, -92.4")).toStrictEqual([-92.4, 50.129931231]);
    });
});
