import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("Geocoding request URL building tests using customize obj", () => {
        expect(
            customizeService.geocode
                .buildGeocodingRequest({
                    apiKey: "API_KEY",
                    commonBaseURL: "https://api.tomtom.com",
                    query: "amsterdam"
                })
                .toString()
        ).toStrictEqual("https://api.tomtom.com/search/2/geocode/amsterdam.json?key=API_KEY");
    });
});
