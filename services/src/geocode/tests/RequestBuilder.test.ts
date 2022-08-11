import { GOSDKConfig } from "@anw/go-sdk-js/core";

import { buildGeocodingRequest } from "../RequestBuilder";

describe("Geocoding request URL building tests", () => {
    afterEach(() => {
        GOSDKConfig.instance.set({ baseDomainURL: "https://api.tomtom.com/" });
    });

    test("Geocoding request URL building test with global config", async () => {
        GOSDKConfig.instance.put({
            apiKey: "GLOBAL_API_KEY",
            baseDomainURL: "https://api-test.tomtom.com/",
            language: "es-ES"
        });

        expect(buildGeocodingRequest({ query: "amsterdam centrale" }).toString()).toStrictEqual(
            "https://api-test.tomtom.com/search/2/geocode/amsterdam%20centrale.json?key=GLOBAL_API_KEY&language=es-ES"
        );
        expect(
            buildGeocodingRequest({ query: "amsterdam centrale", apiKey: "ANOTHER_API_KEY" }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/search/2/geocode/amsterdam%20centrale.json?key=ANOTHER_API_KEY&language=es-ES"
        );
        expect(buildGeocodingRequest({ query: "amsterdam centrale", language: "en-US" }).toString()).toStrictEqual(
            "https://api-test.tomtom.com/search/2/geocode/amsterdam%20centrale.json?key=GLOBAL_API_KEY&language=en-US"
        );
        expect(
            buildGeocodingRequest({
                query: "amsterdam central station",
                apiKey: "ANOTHER_API_KEY",
                customBaseURL: "https://kr-api.tomtom.com/search/3/geocodeCustom/",
                language: "en-US",
                entityTypeSet: ["Country", "CountrySubdivision"],
                radius: 30,
                typeahead: true,
                limit: 20,
                position: [4.78, 51.43],
                extendedPostalCodesFor: ["Addr", "Str"]
            }).toString()
        ).toStrictEqual(
            "https://kr-api.tomtom.com/search/3/geocodeCustom/amsterdam%20central%20station.json?key=ANOTHER_API_KEY&language=en-US&typeahead=true&limit=20&lat=51.43&lon=4.78&radius=30&extendedPostalCodesFor=Addr%2CStr&entityTypeSet=Country%2CCountrySubdivision"
        );

        expect(
            buildGeocodingRequest({
                query: "amsterdam central station",
                apiKey: "ANOTHER_API_KEY",
                language: "en-US",
                boundingBox: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [5.16905, 52.44009],
                            [5.16957, 52.44009],
                            [5.16957, 51.85925],
                            [5.16905, 51.85925],
                            [5.16905, 52.44009]
                        ]
                    ]
                }
            }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/search/2/geocode/amsterdam%20central%20station.json?key=ANOTHER_API_KEY&language=en-US&topLeft=51.85925%2C5.16905&btmRight=52.44009%2C5.16957"
        );
    });

    test("Geocoding request URL building test without global config", async () => {
        expect(buildGeocodingRequest({ query: "4 north 2nd street san jose" }).toString()).toStrictEqual(
            "https://api.tomtom.com/search/2/geocode/4%20north%202nd%20street%20san%20jose.json?key=undefined"
        );

        expect(
            buildGeocodingRequest({
                query: "4 north 2nd street san jose",
                apiKey: "GIVEN_API_KEY",
                language: "en-GB",
                radius: 50,
                typeahead: true,
                limit: 10,
                position: [5.32, 52.5],
                view: "AR",
                extendedPostalCodesFor: ["Addr", "Str"]
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/geocode/4%20north%202nd%20street%20san%20jose.json?key=GIVEN_API_KEY&language=en-GB&typeahead=true&limit=10&lat=52.5&lon=5.32&radius=50&extendedPostalCodesFor=Addr%2CStr&view=AR"
        );

        expect(
            buildGeocodingRequest({
                query: "4 north 2nd street san jose",
                apiKey: "GIVEN_API_KEY",
                language: "en-GB"
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/geocode/4%20north%202nd%20street%20san%20jose.json?key=GIVEN_API_KEY&language=en-GB"
        );
    });
});
