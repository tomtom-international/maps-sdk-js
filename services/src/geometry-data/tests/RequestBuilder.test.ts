import { Place, Places } from "@anw/maps-sdk-js/core";
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

        const testPlaces: Places = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        dataSources: {
                            geometry: {
                                id: "GEOMETRY_ID_0"
                            }
                        }
                    }
                } as Place,
                {
                    type: "Feature",
                    properties: {
                        dataSources: {
                            geometry: {
                                id: "GEOMETRY_ID_1"
                            }
                        }
                    }
                } as Place,
                {
                    type: "Feature",
                    properties: {
                        dataSources: {
                            geometry: {
                                id: "GEOMETRY_ID_2"
                            }
                        }
                    }
                } as Place
            ]
        };

        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: testPlaces,
                zoom: 12
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12"
        );
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: testPlaces.features,
                zoom: 12
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12"
        );

        // Adding place without geometry ID:
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: [...testPlaces.features, { properties: {} } as Place],
                zoom: 12
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12"
        );

        // Adding place without geometry ID:
        expect(
            buildGeometryDataRequest({
                commonBaseURL: "https://api.tomtom.com",
                apiKey: "TEST_API_KEY",
                geometries: [{ properties: { dataSources: {} } } as Place, ...testPlaces.features],
                zoom: 12
            }).toString()
        ).toStrictEqual(
            "https://api.tomtom.com/search/2/additionalData.json?key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12"
        );
    });
});
