import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("Charging availability request URL building tests using customize obj", () => {
        expect(
            customizeService.evChargingStationsAvailability
                .buildEVChargingStationsAvailabilityRequest({
                    apiKey: "API_KEY",
                    apiVersion: 3,
                    commonBaseURL: "https://api.tomtom.com",
                    id: "12345"
                })
                .toString()
        ).toBe("https://api.tomtom.com/maps/orbis/places/ev/id?apiVersion=3&key=API_KEY&id=12345");
    });
});
