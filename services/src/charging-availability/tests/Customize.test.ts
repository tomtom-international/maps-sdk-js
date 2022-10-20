import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("Charging availability request URL building tests using customize obj", () => {
        expect(
            customizeService.chargingAvailability
                .buildChargingAvailabilityRequest({
                    apiKey: "API_KEY",
                    commonBaseURL: "https://api.tomtom.com",
                    id: "12345"
                })
                .toString()
        ).toStrictEqual("https://api.tomtom.com/search/3/chargingAvailability.json?key=API_KEY&id=12345");
    });
});
