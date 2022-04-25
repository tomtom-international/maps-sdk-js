require("isomorphic-fetch");
import { reverseGeocode } from "../ReverseGeocoding";

describe("ReverseGeocode integration tests", () => {
    test("Basic reverse geocoding test", async () => {
        const result = await reverseGeocode([5.72884, 52.33499]);
        console.log(result);
        expect(result).toBeDefined();
    });
});
