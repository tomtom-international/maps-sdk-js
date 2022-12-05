import { buildEVChargingStationsAvailabilityRequest } from "../RequestBuilder";

describe("Charging availability request URL building tests", () => {
    test("Charging availability request URL building tests", () => {
        expect(
            buildEVChargingStationsAvailabilityRequest({
                apiKey: "GLOBAL_API_KEY",
                commonBaseURL: "https://api-test.tomtom.com",
                language: "es-ES",
                id: "1234567890"
            }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/search/3/chargingAvailability.json?key=GLOBAL_API_KEY&language=es-ES&id=1234567890"
        );
    });

    test("Charging availability request URL building with all params tests", () => {
        expect(
            buildEVChargingStationsAvailabilityRequest({
                apiKey: "API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                language: "en-GB",
                id: "1234567890",
                connectorTypes: ["Tesla", "Chademo", "IEC62196Type1"],
                minPowerKW: 6,
                maxPowerKW: 60
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/3/chargingAvailability.json?key=API_KEY&language=en-GB&id=1234567890&connectorSet=Tesla%2CChademo%2CIEC62196Type1&minPowerKW=6&maxPowerKW=60"
        );
    });
});
