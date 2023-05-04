import {
    HILLSHADE_SOURCE_ID,
    MapLibreOptions,
    POI_SOURCE_ID,
    PublishedStyle,
    StyleInput,
    StyleModule,
    TomTomMapParams,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";
import { getNumVisibleLayersBySource, isLayerVisible, waitForMapReady } from "./util/TestUtils";
import { MapsSDKThis } from "./types/MapsSDKThis";

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
            const incidentLayers = await getNumVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID);
            expect(includes(style, "traffic_incidents") ? incidentLayers > 0 : incidentLayers == 0).toBe(true);

            const flowLayers = await getNumVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID);
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

    test("Multiple modules auto-added to the style right after map init", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 10 });
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.TrafficIncidentsModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.TrafficFlowModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
        });
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
