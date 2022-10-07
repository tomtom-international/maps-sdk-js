import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { flowSourceID, incidentsSourceID, VectorTilesTraffic } from "../VectorTilesTraffic";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles traffic module tests", () => {
    test("Constructor with config", () => {
        const incidentsSource = { id: incidentsSourceID };
        const flowSource = { id: flowSourceID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest
                    .fn()
                    .mockImplementationOnce(() => incidentsSource)
                    .mockImplementationOnce(() => flowSource),
                getStyle: jest.fn().mockImplementation(() => ({ layers: [{}] })),
                isStyleLoaded: jest.fn().mockImplementation(() => true)
            } as unknown as Map
        } as GOSDKMap;

        const traffic = new VectorTilesTraffic(goSDKMapMock, {
            incidents: { visible: true, icons: { visible: false } },
            flow: { visible: false }
        });
        expect(traffic).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        traffic.toggleVisibility();
        traffic.toggleIncidentIconsVisibility();
        traffic.toggleIncidentsVisibility();
        traffic.toggleFlowVisibility();
        traffic.setVisible(false);
        traffic.setIncidentsVisible(true);
        traffic.setIncidentIconsVisible(true);
        traffic.setFlowVisible(true);
        traffic.isVisible();
        traffic.isIncidentsVisible();
        traffic.isIncidentIconsVisible();
        traffic.isFlowVisible();
    });

    test("Constructor with no config and no flow in style", () => {
        const incidentsSource = { id: incidentsSourceID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest
                    .fn()
                    .mockImplementationOnce(() => incidentsSource)
                    .mockImplementationOnce(() => undefined),
                getStyle: jest.fn().mockImplementation(() => ({ layers: [{}] })),
                isStyleLoaded: jest.fn().mockImplementation(() => true)
            } as unknown as Map
        } as GOSDKMap;

        const traffic = new VectorTilesTraffic(goSDKMapMock);
        expect(traffic).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
