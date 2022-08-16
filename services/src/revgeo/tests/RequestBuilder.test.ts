import { GOSDKConfig } from "@anw/go-sdk-js/core";

import { buildRevGeoRequest } from "../RequestBuilder";

describe("Reverse Geocoding request URL building tests", () => {
    afterEach(() => {
        GOSDKConfig.instance.set({ baseDomainURL: "https://api.tomtom.com/" });
    });

    test("Reverse Geocoding request URL building test with global config", async () => {
        GOSDKConfig.instance.put({
            apiKey: "GLOBAL_API_KEY",
            baseDomainURL: "https://api-test.tomtom.com/",
            language: "es-ES"
        });

        expect(buildRevGeoRequest({ position: [1.12345, 23.45678] }).toString()).toStrictEqual(
            "https://api-test.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GLOBAL_API_KEY&language=es-ES"
        );
        expect(
            buildRevGeoRequest({ position: [1.12345, 23.45678], apiKey: "ANOTHER_API_KEY" }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=ANOTHER_API_KEY&language=es-ES"
        );
        expect(buildRevGeoRequest({ position: [-1.12345, -23.45678], language: "en-US" }).toString()).toStrictEqual(
            "https://api-test.tomtom.com/search/2/reverseGeocode/-23.45678,-1.12345.json?key=GLOBAL_API_KEY&language=en-US"
        );
        expect(
            buildRevGeoRequest({
                position: [-100.12345, -23.45678],
                apiKey: "ANOTHER_API_KEY",
                customBaseURL: "https://api.tomtom.com/search/10/reverseGeocodeTest/",
                language: "en-US",
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                roadUse: ["LimitedAccess", "Arterial"],
                view: "AR"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/10/reverseGeocodeTest/-23.45678,-100.12345.json?key=ANOTHER_API_KEY&language=en-US&heading=30&number=10A&radius=30&returnRoadUse=true&roadUse=%5B%22LimitedAccess%22%2C%22Arterial%22%5D"
        );
    });

    test("Reverse Geocoding request URL building test without global config", async () => {
        expect(buildRevGeoRequest({ position: [1.12345, 23.45678] }).toString()).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=undefined"
        );

        expect(
            buildRevGeoRequest({
                position: [1.12345, 23.45678],
                apiKey: "GIVEN_API_KEY",
                language: "es-ES",
                allowFreeformNewline: true,
                geographyType: ["Country", "Municipality"],
                mapcodes: ["Local", "International"],
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                returnSpeedLimit: true,
                roadUse: ["LimitedAccess", "Arterial"],
                view: "AR"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GIVEN_API_KEY&language=es-ES&allowFreeformNewline=true&entityType=Country%2CMunicipality&heading=30&mapcodes=Local%2CInternational&number=10A&radius=30&returnSpeedLimit=true&returnRoadUse=true&roadUse=%5B%22LimitedAccess%22%2C%22Arterial%22%5D"
        );

        expect(
            buildRevGeoRequest({ position: [1.12345, 23.45678], apiKey: "GIVEN_API_KEY", language: "en-GB" }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GIVEN_API_KEY&language=en-GB"
        );
    });

    test("Basic performance test", async () => {
        const numExecutions = 10;
        let accExecTimes = 0;
        for (let i = 0; i < numExecutions; i++) {
            const start = performance.now();
            buildRevGeoRequest({
                position: [1.12345, 23.45678],
                apiKey: "GIVEN_API_KEY",
                language: "es-ES",
                allowFreeformNewline: true,
                geographyType: ["Country", "Municipality"],
                mapcodes: ["Local", "International"],
                heading: 30,
                number: "10A",
                radius: 30,
                returnRoadUse: true,
                returnSpeedLimit: true,
                roadUse: ["LimitedAccess", "Arterial"],
                view: "AR"
            });
            accExecTimes += performance.now() - start;
        }
        expect(accExecTimes / numExecutions).toBeLessThan(2);
    });
});
