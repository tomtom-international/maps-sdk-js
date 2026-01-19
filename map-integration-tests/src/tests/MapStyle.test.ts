import { expect, test } from '@playwright/test';
import {
    HILLSHADE_SOURCE_ID,
    mapStyleLayerIDs,
    standardStyleIDs,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getLayerById,
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    getNumVisiblePOILayers,
    setStyle,
    waitForMapReady,
} from './util/TestUtils';

test.describe('Map Style tests', () => {
    const mapEnv = new MapTestEnv();

    test('Switching between all standard styles', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });
        await waitForMapReady(page);

        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            await mapsSdkThis.MapsSDK.TrafficIncidentsModule.get(mapsSdkThis.tomtomMap, { visible: true });
            await mapsSdkThis.MapsSDK.TrafficFlowModule.get(mapsSdkThis.tomtomMap, { visible: true });
            await mapsSdkThis.MapsSDK.HillshadeModule.get(mapsSdkThis.tomtomMap, { visible: true });
        });

        expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();

        // Switch to each standard style and verify layers remain
        for (const styleId of standardStyleIDs) {
            await setStyle(page, styleId);
            await waitForMapReady(page);

            expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
