import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { Map } from "maplibre-gl";

import { Geometry, geometrySourceID } from "../Geometry";
import { GOSDKMap } from "../../GOSDKMap";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Geometry module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const geometrySource = { id: geometrySourceID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockImplementationOnce(() => geometrySource),
                getStyle: jest.fn().mockImplementation(() => ({ layers: [{}], sources: { geometrySourceID: {} } })),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockImplementation(() => true),
                setLayoutProperty: jest.fn()
            } as unknown as Map
        } as GOSDKMap;
        const testGeometry = {
            type: "FeatureCollection",
            bbox: [-0.3513754, 51.385139, 0.1447063, 51.6722571],
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: []
                    },
                    id: "",
                    bbox: [-0.3513754, 51.385139, 0.1447063, 51.6722571]
                }
            ]
        } as GeometryDataResponse;
        const geometry = new Geometry(goSDKMapMock);
        geometry.show(testGeometry, true);
        geometry.clear();
    });
});
