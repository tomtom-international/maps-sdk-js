import { buildGeometryDataRequest } from "../RequestBuilder";

describe("Geometry data request URL building functional tests", () => {
    test("Geometry data request URL building tests", () => {
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: ["GEOMETRY_ID"]
            }).toString()
        ).toStrictEqual("https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID");
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: ["GEOMETRY_ID_0", "GEOMETRY_ID_1"]
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1"
        );
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: ["GEOMETRY_ID_0", "GEOMETRY_ID_1"],
                zoom: 12
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1&geometriesZoom=12"
        );
    });
});
