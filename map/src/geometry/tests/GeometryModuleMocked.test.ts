import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { Map } from "maplibre-gl";
import { GeometryModule } from "../GeometryModule";
import { GOSDKMap } from "../../GOSDKMap";
import amsterdamGeometryData from "./GeometryModuleMocked.test.data.json";
import { GEOMETRY_SOURCE_ID } from "../../core/layers/sourcesIDs";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Geometry module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const geometrySource = { id: GEOMETRY_SOURCE_ID, setData: jest.fn() };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValue(geometrySource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { geometrySourceID: {} } }),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                setLayoutProperty: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn()
            }
        } as unknown as GOSDKMap;

        const testGeometryData = amsterdamGeometryData as GeometryDataResponse;
        let geometry = new GeometryModule(goSDKMapMock);
        geometry.show(testGeometryData);
        geometry.show(testGeometryData);
        geometry.clear();
        geometry = new GeometryModule(goSDKMapMock);
        geometry.show(testGeometryData);
        geometry.clear();
    });
});
