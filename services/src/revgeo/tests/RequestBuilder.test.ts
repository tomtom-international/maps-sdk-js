import { buildRevGeoRequest } from "../RequestBuilder";
import { GOSDKConfig } from "core/src";

describe("Reverse Geocoding request URL building tests", () => {
    test("Reverse Geocoding request URL building test with global config", async () => {
        GOSDKConfig.instance.put({
            apiKey: "GLOBAL_API_KEY",
            language: "es-ES"
        });

        expect(buildRevGeoRequest([1.12345, 23.45678]).toString()).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=GLOBAL_API_KEY&language=es-ES"
        );
        expect(buildRevGeoRequest([1.12345, 23.45678], { apiKey: "ANOTHER_API_KEY" }).toString()).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=ANOTHER_API_KEY&language=es-ES"
        );
        expect(buildRevGeoRequest([-1.12345, -23.45678], { language: "en-US" }).toString()).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/-23.45678,-1.12345.json?key=GLOBAL_API_KEY&language=en-US"
        );
        expect(
            buildRevGeoRequest([-100.12345, -23.45678], {
                apiKey: "ANOTHER_API_KEY",
                language: "en-US",
                radius: 30
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/reverseGeocode/-23.45678,-100.12345.json?key=ANOTHER_API_KEY&language=en-US&radius=30"
        );
    });

    test("Reverse Geocoding request URL building test without global config", async () => {
        // TODO
    });
});
