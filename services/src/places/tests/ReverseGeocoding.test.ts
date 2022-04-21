import { reverseGeocode } from "../ReverseGeocoding";

describe("ReverseGeocode integration tests", () => {
    test("Basic reverse geocoding test", async () => {
        const result = await reverseGeocode({} as any);
        console.log(result);
        expect(result).toBeDefined();
    });
});
