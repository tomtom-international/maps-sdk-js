import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { VectorTilePOIs } from "../VectorTilePOIs";
import { POI_SOURCE_ID } from "../../core/layers/sourcesIDs";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles POI module tests", () => {
    test("Constructor with config", () => {
        const poiSource = { id: POI_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(poiSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { poiSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map
        } as GOSDKMap;

        const pois = new VectorTilePOIs(goSDKMapMock, {
            visible: false
        });
        expect(pois).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        pois.toggleVisibility();
        pois.setVisible(false);
        pois.isVisible();
    });

    test("Constructor with no config", () => {
        const poiSource = { id: POI_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(poiSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { poiSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map
        } as GOSDKMap;

        const pois = new VectorTilePOIs(goSDKMapMock);
        expect(pois).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
