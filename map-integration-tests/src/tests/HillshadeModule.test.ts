import { expect, test } from '@playwright/test';
import { HILLSHADE_SOURCE_ID, TRAFFIC_FLOW_SOURCE_ID, TRAFFIC_INCIDENTS_SOURCE_ID } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    initHillshade,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
} from './util/TestUtils';

test.describe('Map vector tiles hillshade module tests', () => {
    const mapEnv = new MapTestEnv();

    test('Load hillshade with visility', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await initHillshade(page, { visible: true });
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
    });

    test('Success to initialize if not included in the style, but auto adding it later', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { center: [7.12621, 48.50394], zoom: 8 },
            { style: { type: 'standard', include: [] } },
        );
        await initHillshade(page, { visible: true });
        await waitForMapReady(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Success to initialize if explicitly included in the style', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { center: [7.12621, 48.50394], zoom: 8 },
            { style: { type: 'standard', include: ['hillshade'] } },
        );
        await initHillshade(page);
        await waitForMapReady(page);

        // hidden by default:
        expect(await getNumLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toEqual(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Vector tiles hillshade visibility changes in different ways', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

        await initHillshade(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({}));
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        // changing style at runtime, verifying hillshade is still there:
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        // changing style at runtime, verifying hillshade is still there:
        await setStyle(page, 'monoDark');
        await waitForMapIdle(page);
        // The config was reset above, so hillshade will be restored as invisible:
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
