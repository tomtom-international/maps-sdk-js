import { expect, type Page, test } from '@playwright/test';
import { HILLSHADE_SOURCE_ID, TERRAIN_SOURCE_ID, TRAFFIC_FLOW_SOURCE_ID, TRAFFIC_INCIDENTS_SOURCE_ID } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    initTerrain,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
} from './util/TestUtils';

const INNSBRUCK: [number, number] = [11.39345, 47.26685];

const getMapTerrain = (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.getTerrain());

const isHillshadeVisible = (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).terrain?.isHillshadeVisible());

test.describe('Terrain module tests', () => {
    const mapEnv = new MapTestEnv();

    test.describe('hillshade', () => {
        test('Load hillshade visible', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
            await initTerrain(page, { hillshade: true });
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
            expect(await getMapTerrain(page)).toBeNull();
        });

        test('Adds the elevation style part when the style does not include it', async ({ page }) => {
            await mapEnv.loadPageAndMap(
                page,
                { center: [7.12621, 48.50394], zoom: 8 },
                { style: { type: 'standard', include: [] } },
            );
            await initTerrain(page, { hillshade: true });
            await waitForMapReady(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        });

        test('Leaves an included elevation style part hidden without a config', async ({ page }) => {
            await mapEnv.loadPageAndMap(
                page,
                { center: [7.12621, 48.50394], zoom: 8 },
                { style: { type: 'standard', include: ['hillshade'] } },
            );
            await initTerrain(page);
            await waitForMapReady(page);

            expect(await getNumLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);
            expect(await getMapTerrain(page)).toBeNull();
            expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toEqual(0);
            expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toEqual(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });

        test('Hillshade visibility changes in different ways', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

            await initTerrain(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.setHillshadeVisible(true));
            expect(await isHillshadeVisible(page)).toBe(true);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.setHillshadeVisible(false));
            expect(await isHillshadeVisible(page)).toBe(false);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.applyConfig({ hillshade: true }));
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.resetConfig());
            expect(await isHillshadeVisible(page)).toBe(false);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.applyConfig({}));
            await waitForMapIdle(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

            // The reset config is carried across style changes, so hillshade stays hidden:
            await setStyle(page, 'monoLight');
            await waitForMapIdle(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

            await setStyle(page, 'monoDark');
            await waitForMapIdle(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });

        test('Hillshade stays hidden when style changes immediately after resetConfig', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

            await initTerrain(page, { hillshade: true });
            await waitForMapIdle(page);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.resetConfig());
            await setStyle(page, 'standardDark');
            await waitForMapIdle(page);

            expect(await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.getConfig())).toBeUndefined();
            expect(await isHillshadeVisible(page)).toBe(false);
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    });

    test.describe('3D elevation', () => {
        test('Raises the surface from its own copy of the elevation source', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 12, center: INNSBRUCK });
            await initTerrain(page, { elevation: true });
            expect(await getMapTerrain(page)).toMatchObject({ source: TERRAIN_SOURCE_ID, exaggeration: 1 });
            // Elevation alone leaves the shading off:
            expect(await isHillshadeVisible(page)).toBe(false);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        });

        test('Elevation changes through the module reach the map and the config', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 12, center: INNSBRUCK });
            await initTerrain(page, { elevationExaggeration: 2 });
            expect(await getMapTerrain(page)).toBeNull();

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.setElevationEnabled(true));
            expect(await getMapTerrain(page)).toMatchObject({ source: TERRAIN_SOURCE_ID, exaggeration: 2 });
            expect(await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.isElevationEnabled())).toBe(true);

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.setElevationExaggeration(1.5));
            expect(await getMapTerrain(page)).toMatchObject({ exaggeration: 1.5 });

            await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.setElevationEnabled(false));
            expect(await getMapTerrain(page)).toBeNull();
            expect(await page.evaluate(() => (globalThis as MapsSDKThis).terrain?.getConfig())).toEqual({
                elevationExaggeration: 1.5,
                elevation: false,
            });
            expect(mapEnv.consoleErrors).toHaveLength(0);
        });

        test('Hillshade and elevation are restored after a style change', async ({ page }) => {
            await mapEnv.loadPageAndMap(page, { zoom: 12, center: INNSBRUCK });
            await initTerrain(page, { hillshade: true, elevation: true, elevationExaggeration: 1.3 });

            await setStyle(page, 'monoLight');
            await waitForMapReady(page);
            await waitForMapIdle(page);

            expect(await getMapTerrain(page)).toMatchObject({ source: TERRAIN_SOURCE_ID, exaggeration: 1.3 });
            expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBe(1);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    });
});
