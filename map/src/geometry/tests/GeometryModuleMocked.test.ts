import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { Map } from "maplibre-gl";

import { GeometryModule, geometrySourceID } from "../GeometryModule";
import { GOSDKMap } from "../../GOSDKMap";
import amsterdamGeometryData from "./GeometryModuleMocked.test.data.json";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Geometry module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const geometrySource = { id: geometrySourceID, setData: jest.fn() };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockImplementation(() => geometrySource),
                getStyle: jest.fn().mockImplementation(() => ({ layers: [{}], sources: { geometrySourceID: {} } })),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockImplementation(() => true),
                setLayoutProperty: jest.fn()
            } as unknown as Map
        } as GOSDKMap;
        const testGeometryData = amsterdamGeometryData as GeometryDataResponse;
        let geometry = new GeometryModule(goSDKMapMock);
        geometry.show(testGeometryData);
        geometry.show(testGeometryData, { });
        geometry.clear();
        geometry = new GeometryModule(goSDKMapMock, { });
        geometry.show(testGeometryData);
        geometry.clear();
    });
});
