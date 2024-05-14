import { test, expect } from "@playwright/test";
import type { MapLibreOptions, PublishedStyle, StyleInput, StyleModule, TomTomMapParams } from "map";
import {
    HILLSHADE_SOURCE_ID,
    mapStyleLayerIDs,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID
} from "map/src/shared";
import { MapTestEnv } from "./util/MapTestEnv";
import mapInitTestData from "./data/MapInit.test.data.json";
import {
    getLayerById,
    getNumVisibleLayersBySource,
    getNumVisiblePOILayers,
    setStyle,
    waitForMapReady
} from "./util/TestUtils";
import type { MapsSDKThis } from "./types/MapsSDKThis";

const includes = (style: StyleInput | undefined, module: StyleModule): boolean =>
    !!(style as PublishedStyle)?.include?.includes(module);

test.describe("Map Init tests", () => {
    const mapEnv = new MapTestEnv();

    for (const testData of mapInitTestData as [string, Partial<MapLibreOptions>, TomTomMapParams][]) {
        test(testData[0], async ({ page }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_name, mapLibreOptions, tomtomMapParams] = testData;
            await mapEnv.loadPageAndMap(page, mapLibreOptions, tomtomMapParams);
            await waitForMapReady(page);

            const style = tomtomMapParams.style;
            const incidentLayers = await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID);
            expect(includes(style, "trafficIncidents") ? incidentLayers > 0 : incidentLayers == 0).toBe(true);

            const flowLayers = await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID);
            expect(includes(style, "trafficFlow") ? flowLayers > 0 : flowLayers == 0).toBe(true);

            expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(1);

            const hillshadeLayers = await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID);
            expect(includes(style, "hillshade") ? hillshadeLayers > 0 : hillshadeLayers == 0).toBe(true);

            // we verify that common base map key layers are present in all styles:
            expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
            // TODO: Satellite Orbis maps don't currently support the current lowest Road Line layer (Tunnel - Railway outline)
            //expect(await getLayerById(mapStyleLayerIDs.lowestRoadLine)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    }

    test("Multiple modules auto-added to the style right after map init", async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.TrafficIncidentsModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
            await mapsSDKThis.MapsSDK.TrafficFlowModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
        });

        expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);

        // changing style, verifying all parts are still there:
        await setStyle(page, "monoLight");
        await waitForMapReady(page);
        expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);

        // we verify that all the base map key layers are present:
        expect(await getLayerById(page, mapStyleLayerIDs.lowestBuilding)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.lowestRoadLine)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
