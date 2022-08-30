import reverseGeocode from "../../revgeo/ReverseGeocoding";
import { SDKError } from "../Errors";
import { putIntegrationTestsAPIKey } from "./IntegrationTestUtils";

describe("Reverse Geocoding integration test without API key", () => {
    test("Reverse Geocoding integration test without API key", async () => {
        const coordinates = { position: [5.72884, 52.33499] };

        await expect(reverseGeocode(coordinates)).rejects.toBeInstanceOf(SDKError);
        await expect(reverseGeocode(coordinates)).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("Reverse Geocoding integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test("Reverse Geocoding integration with invalid coordinates", async () => {
        await expect(reverseGeocode({ position: [-232, -22] })).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Invalid request: invalid position: latitude/longitude out of range.",
            status: 400
        });
    });
});
