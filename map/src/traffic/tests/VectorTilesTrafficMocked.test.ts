import { Map } from "maplibre-gl";
import { VECTOR_TILES_INCIDENTS_SOURCE_ID, VECTOR_TILES_FLOW_SOURCE_ID } from "../../core";
import { GOSDKMap } from "../../GOSDKMap";
import { VectorTilesTraffic } from "../VectorTilesTraffic";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles traffic module tests", () => {
    test("Constructor with config", () => {
        const incidentsSource = { id: VECTOR_TILES_INCIDENTS_SOURCE_ID };
        const flowSource = { id: VECTOR_TILES_FLOW_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(incidentsSource).mockReturnValueOnce(flowSource),
                getStyle: jest
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn()
            }
        } as unknown as GOSDKMap;

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
        const incidentsSource = { id: VECTOR_TILES_INCIDENTS_SOURCE_ID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(incidentsSource).mockReturnValueOnce(undefined),
                getStyle: jest
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn()
            }
        } as unknown as GOSDKMap;

        const traffic = new VectorTilesTraffic(goSDKMapMock);
        expect(traffic).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
