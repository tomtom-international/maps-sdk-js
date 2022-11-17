import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { HILLSHADE_SOURCE_ID, VectorTilesHillshade } from "../VectorTilesHillshade";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles Hillshade module tests", () => {
    test("Constructor with config", () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(hillshadeSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map
        } as GOSDKMap;

        const hillshade = new VectorTilesHillshade(goSDKMapMock, {
            visible: false
        });
        expect(hillshade).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        hillshade.toggleVisibility();
        hillshade.setVisible(false);
        hillshade.isVisible();
    });

    test("Constructor with no config", () => {
        const hillshadeSource = { id: HILLSHADE_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(hillshadeSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { hillshadeSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map
        } as GOSDKMap;

        const hillshade = new VectorTilesHillshade(goSDKMapMock);
        expect(hillshade).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
