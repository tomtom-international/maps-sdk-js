import { buildRevGeoRequest } from "../RequestBuilder";

describe("Reverse Geocoding request URL building functional tests", () => {
    test("Reverse Geocoding request URL building test", async () => {
        expect(
            buildRevGeoRequest({
                apiKey: "GLOBAL_API_KEY",
                commonBaseURL: "https://api-test.tomtom.com",
                language: "es-ES",
                position: [1.12345, 23.45678]
            }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GLOBAL_API_KEY&language=es-ES"
        );
        expect(
            buildRevGeoRequest({
                position: [-100.12345, -23.45678],
                apiKey: "ANOTHER_API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                customServiceBaseURL: "https://api.tomtom.com/search/10/reverseGeocodeTest",
                language: "en-US",
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                roadUses: ["LimitedAccess", "Arterial"],
                view: "AR"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/10/reverseGeocodeTest/-23.45678,-100.12345.json?key=ANOTHER_API_KEY&language=en-US&heading=30&number=10A&radius=30&returnRoadUse=true&roadUse=%5B%22LimitedAccess%22%2C%22Arterial%22%5D"
        );

        expect(
            buildRevGeoRequest({ commonBaseURL: "https://api.tomtom.com", position: [1.12345, 23.45678] }).toString()
        ).toStrictEqual("https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=undefined");

        expect(
            buildRevGeoRequest({
                position: [1.12345, 23.45678],
                apiKey: "GIVEN_API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                language: "es-ES",
                allowFreeformNewline: true,
                geographyType: ["Country", "Municipality"],
                mapcodes: ["Local", "International"],
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                returnSpeedLimit: true,
                roadUses: ["LimitedAccess", "Arterial"],
                view: "AR"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GIVEN_API_KEY&language=es-ES&allowFreeformNewline=true&entityType=Country%2CMunicipality&heading=30&mapcodes=Local%2CInternational&number=10A&radius=30&returnSpeedLimit=true&returnRoadUse=true&roadUse=%5B%22LimitedAccess%22%2C%22Arterial%22%5D"
        );

        expect(
            buildRevGeoRequest({
                position: [1.12345, 23.45678],
                apiKey: "GIVEN_API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                language: "en-GB"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GIVEN_API_KEY&language=en-GB"
        );
    });
});

describe("Reverse Geocoding request URL building performance tests", () => {
    test("Basic performance test", () => {
        const numExecutions = 20;
        const accExecTimes = [];
        for (let i = 0; i < numExecutions; i++) {
            const start = performance.now();
            buildRevGeoRequest({
                position: [1.12345, 23.45678],
                apiKey: "GIVEN_API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                language: "es-ES",
                allowFreeformNewline: true,
                geographyType: ["Country", "Municipality"],
                mapcodes: ["Local", "International"],
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                returnSpeedLimit: true,
                roadUses: ["LimitedAccess", "Arterial"],
                view: "AR"
            });
            accExecTimes.push(performance.now() - start);
        }
        expect(Math.min.apply(null, accExecTimes)).toBeLessThan(2);
    });
});
