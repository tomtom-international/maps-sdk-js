import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("revgeo request URL building tests using customize obj", () => {
        expect(
            customizeService.reverseGeocode
                .buildRevGeoRequest({
                    apiKey: "API_KEY",
                    commonBaseURL: "https://test.tomtom.com",
                    position: [1.12345, 23.45678]
                })
                .toString()
        ).toStrictEqual("https://test.tomtom.com/search/2/reverseGeocode/23.45678,1.12345.json?key=API_KEY");
    });
});
