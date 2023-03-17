import { Map } from "maplibre-gl";
import { VECTOR_TILES_FLOW_SOURCE_ID, VECTOR_TILES_INCIDENTS_SOURCE_ID } from "../../shared";
import { TomTomMap } from "../../TomTomMap";
import { VectorTilesTraffic } from "../VectorTilesTraffic";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles traffic module tests", () => {
    test("Initializing module with config", async () => {
        const incidentsSource = { id: VECTOR_TILES_INCIDENTS_SOURCE_ID };
        const flowSource = { id: VECTOR_TILES_FLOW_SOURCE_ID };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(incidentsSource).mockReturnValueOnce(flowSource),
                getStyle: jest
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            }
        } as unknown as TomTomMap;

        const traffic = await VectorTilesTraffic.init(tomtomMapMock, {
            incidents: {
                visible: true,
                filters: { any: [{ roadCategories: { show: "only", values: ["motorway", "trunk"] } }] },
                icons: {
                    visible: false,
                    filters: { any: [{ roadCategories: { show: "only", values: ["motorway"] } }] }
                }
            },

            flow: {
                visible: false,
                filters: { any: [{ roadCategories: { show: "only", values: ["motorway", "trunk"] } }] }
            }
        });
        expect(traffic).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        traffic.setVisible(true);
        traffic.setIncidentsVisible(true);
        traffic.setIncidentIconsVisible(true);
        traffic.setFlowVisible(true);
        traffic.setVisible(false);
        traffic.setIncidentsVisible(false);
        traffic.setIncidentIconsVisible(false);
        traffic.setFlowVisible(false);
        traffic.anyLayersVisible();
        traffic.anyIncidentLayersVisible();
        traffic.anyIncidentIconLayersVisible();
        traffic.anyFlowLayersVisible();

        // (see note on top of test file)
        traffic.applyConfig(undefined);
        traffic.applyConfig({});
        traffic.applyConfig({ visible: true });
        traffic.applyConfig({ incidents: { visible: false }, flow: { visible: true } });
        traffic.applyConfig({ visible: false, incidents: { visible: false, icons: { visible: true } } });
    });

    test("Initializing module with no config and no flow in style", async () => {
        const incidentsSource = { id: VECTOR_TILES_INCIDENTS_SOURCE_ID };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(incidentsSource).mockReturnValueOnce(undefined),
                getStyle: jest
                    .fn()
                    .mockReturnValue({ layers: [{}], sources: { incidentsSourceID: {}, flowSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true)
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            }
        } as unknown as TomTomMap;

        const traffic = await VectorTilesTraffic.init(tomtomMapMock);
        expect(traffic).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });
});
