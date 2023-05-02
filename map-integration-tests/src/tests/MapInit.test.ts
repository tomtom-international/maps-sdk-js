import {
    HILLSHADE_SOURCE_ID,
    MapLibreOptions,
    POI_SOURCE_ID,
    PublishedStyle,
    StyleInput,
    StyleModule,
    TomTomMapParams,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";
import { getNumVisibleLayersBySource, isLayerVisible, waitForMapReady } from "./util/TestUtils";

const includes = (style: StyleInput | undefined, module: StyleModule): boolean =>
    !!(style as PublishedStyle)?.include?.includes(module);

describe("Map Init tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test.each(mapInitTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, mapLibreOptions: MapLibreOptions, tomtomMapParams: TomTomMapParams) => {
            await mapEnv.loadMap(mapLibreOptions, tomtomMapParams);
            await waitForMapReady();

            const style = tomtomMapParams.style;
            const incidentLayers = await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID);
            expect(includes(style, "traffic_incidents") ? incidentLayers > 0 : incidentLayers == 0).toBe(true);

            const flowLayers = await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID);
            expect(includes(style, "traffic_flow") ? flowLayers > 0 : flowLayers == 0).toBe(true);

            const poiLayersBySource = await getNumVisibleLayersBySource(POI_SOURCE_ID);
            expect(includes(style, "poi") ? poiLayersBySource > 0 : poiLayersBySource == 0).toBe(true);
            // double-checking against potential base-map "default" POIs (based on base map vector tiles source):
            const poiLayerVisible = await isLayerVisible("POI");
            expect(includes(style, "poi") ? poiLayerVisible : !poiLayerVisible).toBe(true);

            const hillshadeLayers = await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID);
            expect(includes(style, "hillshade") ? hillshadeLayers > 0 : hillshadeLayers == 0).toBe(true);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
