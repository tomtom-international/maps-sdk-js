import { expect, test } from '@playwright/test';
import { HILLSHADE_SOURCE_ID, TRAFFIC_FLOW_SOURCE_ID, TRAFFIC_INCIDENTS_SOURCE_ID } from 'map';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumVisibleLayersBySource,
    initHillshade,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
} from './util/TestUtils';

test.describe('Map vector tiles hillshade module tests', () => {
    const mapEnv = new MapTestEnv();

    test('Failing to initialize if excluded from the style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 8 });
        await expect(initHillshade(page)).rejects.toBeDefined();
    });

    test('Success to initialize if not included in the style, but auto adding it', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 8 });
        await initHillshade(page, { ensureAddedToStyle: true });
        await waitForMapReady(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Success to initialize if included in the style, also with auto-inclusion flag (ignored)', async ({
        page,
    }) => {
        await mapEnv.loadPageAndMap(
            page,
            { center: [7.12621, 48.50394], zoom: 8 },
            { style: { type: 'published', include: ['hillshade'] } },
        );
        await initHillshade(page, { ensureAddedToStyle: true });
        await waitForMapReady(page);

        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toEqual(0);
        // TODO: POIs are included in the base map for now
        // expect(await getNumVisibleLayersBySource(page, POI_SOURCE_ID)).toEqual(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Vector tiles hillshade visibility changes in different ways', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: 'published', include: ['hillshade'] } },
        );

        await initHillshade(page, { visible: false });
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({}));
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        // changing style at runtime, verifying hillshade is still there:
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
