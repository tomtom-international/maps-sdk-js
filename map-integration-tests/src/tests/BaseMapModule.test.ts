import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { BaseMapLayerGroupName, BaseMapLayerGroups } from 'map';
import { BASE_MAP_SOURCE_ID, baseMapLayerGroupNames, poiLayerIDs } from 'map';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    initBasemap,
    initBasemap2,
    waitForMapReady,
} from './util/TestUtils';

const getBaseMapLayerCount = async (page: Page): Promise<number> =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.sourceAndLayerIDs.vectorTiles.layerIDs.length as number);

const getBaseMap2LayerCount = async (page: Page): Promise<number> =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.sourceAndLayerIDs.vectorTiles.layerIDs.length as number);

const setBaseMapVisible = async (page: Page, visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }) =>
    page.evaluate(({ visible, options }) => (globalThis as MapsSDKThis).baseMap?.setVisible(visible, options), {
        visible,
        options,
    });

const isBaseMapVisible = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.isVisible());

const getBaseMapConfig = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.getConfig());

const setBaseMap2Visible = async (page: Page, visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }) =>
    page.evaluate(({ visible, options }) => (globalThis as MapsSDKThis).baseMap2?.setVisible(visible, options), {
        visible,
        options,
    });

const isBaseMap2Visible = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.isVisible());

const getBaseMap2Config = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.getConfig());

test.describe('BaseMap module tests', () => {
    const mapEnv = new MapTestEnv();

    test.beforeEach(async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapReady(page);
    });

    test('BaseMap modules and multiple visibility changes', async ({ page }) => {
        await initBasemap(page);
        expect(await getBaseMapConfig(page)).toBeUndefined();
        let vectorTilesLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBeGreaterThanOrEqual(87);
        // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(
            vectorTilesLayersCount - 20,
        );
        // This base map contains all the vector tile layers minus the POIs:
        const originalBaseMapLayerCount = await getBaseMapLayerCount(page);
        expect(originalBaseMapLayerCount).toBe(vectorTilesLayersCount - poiLayerIDs.length);

        await setBaseMapVisible(page, false);
        expect(await getBaseMapConfig(page)).toEqual({ visible: false });
        expect(await isBaseMapVisible(page)).toBe(false);
        // we hid the base map (but the POI layers remain):
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBe(poiLayerIDs.length);

        // (making the base map visible again)
        await setBaseMapVisible(page, true);
        expect(await getBaseMapConfig(page)).toEqual({ visible: true });
        expect(await getBaseMapLayerCount(page)).toBe(originalBaseMapLayerCount);

        // ANOTHER BASE MAP MODULE INSTANCE WITH LAYER GROUPS FILTERED:
        await initBasemap2(page, { layerGroupsFilter: { mode: 'include', names: ['land', 'water'] } });
        expect(await getBaseMap2Config(page)).toEqual({
            layerGroupsFilter: { mode: 'include', names: ['land', 'water'] },
        });
        // double-checking we haven't altered the overall visible base map layers:
        vectorTilesLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBe(originalBaseMapLayerCount + poiLayerIDs.length);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(vectorTilesLayersCount - 5);
        expect(await getBaseMapLayerCount(page)).toBe(originalBaseMapLayerCount);
        // the second base map module should have just a subset of the overall layers:
        expect(await getBaseMap2LayerCount(page)).toBeLessThan(vectorTilesLayersCount / 2);

        // we make the second base map module instance invisible, which should hide only some layers:
        await setBaseMap2Visible(page, false);
        expect(await getBaseMap2Config(page)).toEqual({
            visible: false,
            layerGroupsFilter: { mode: 'include', names: ['land', 'water'] },
        });
        expect(await isBaseMap2Visible(page)).toBe(false);
        // (the overall base map is still visible since some layer are still visible):
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeLessThan(vectorTilesLayersCount);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('BaseMap module and visibility changes for some layer groups', async ({ page }) => {
        // Initializing a base map with all layers:
        await initBasemap(page);
        const defaultVisibleLayers = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
        // Hiding road shields:
        await setBaseMapVisible(page, false, { layerGroups: { mode: 'include', names: ['roadShields'] } });

        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeLessThan(defaultVisibleLayers);
        // we should only have a few layers less visible:
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(defaultVisibleLayers - 10);

        // Making all layers visible again:
        await setBaseMapVisible(page, true);
        // (3D buildings usually are invisible by default, so we end up with one or more extra visible layers)
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThanOrEqual(
            defaultVisibleLayers + 1,
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('BaseMap modules and visibility changes for some layer groups', async ({ page }) => {
        // Initializing a base map with all layers:
        await initBasemap(page);
        await initBasemap2(page, { layerGroupsFilter: { mode: 'include', names: ['land'] } });
        expect(await getBaseMap2Config(page)).toEqual({ layerGroupsFilter: { mode: 'include', names: ['land'] } });

        // Hiding land via the first generic base map module:
        await setBaseMapVisible(page, false, { layerGroups: { mode: 'include', names: ['land'] } });
        // The first base map module should be visible because many layers are still visible:
        expect(await isBaseMapVisible(page)).toBe(true);
        // The second base map module, based only on land, should be now invisible:
        expect(await isBaseMap2Visible(page)).toBe(false);
        // Caveat: even if it's invisible, the config of the second base map doesn't state invisibility, since it was changed via another map module:
        expect(await getBaseMap2Config(page)).toEqual({ layerGroupsFilter: { mode: 'include', names: ['land'] } });

        // Showing land again:
        await setBaseMapVisible(page, true, { layerGroups: { mode: 'include', names: ['land'] } });
        expect(await isBaseMap2Visible(page)).toBe(true);

        // Hiding everything but land:
        await setBaseMapVisible(page, false, { layerGroups: { mode: 'exclude', names: ['land'] } });
        // Land module still visible:
        expect(await isBaseMap2Visible(page)).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Two BaseMap modules with mutually exclusive groups', async ({ page }) => {
        const originalLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        const originalVisibleLayersCount = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);

        const names: BaseMapLayerGroupName[] = ['roadLines', 'roadShields', 'roadLabels'];

        // "foundation" base map excluding roads:
        await initBasemap(page, { layerGroupsFilter: { mode: 'exclude', names } });
        // second base map with roads only (should be mutually exclusive):
        await initBasemap2(page, { layerGroupsFilter: { mode: 'include', names } });

        // double-checking we haven't altered the overall base map layers:
        expect(await getNumLayersBySource(page, BASE_MAP_SOURCE_ID)).toBe(originalLayersCount);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBe(originalVisibleLayersCount);

        // changing visibilities and ensuring one base map doesn't affect the other:
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await isBaseMap2Visible(page)).toBe(true);

        await setBaseMapVisible(page, false);
        expect(await isBaseMapVisible(page)).toBe(false);
        expect(await isBaseMap2Visible(page)).toBe(true);

        await setBaseMap2Visible(page, false);
        expect(await isBaseMapVisible(page)).toBe(false);
        expect(await isBaseMap2Visible(page)).toBe(false);

        await setBaseMapVisible(page, true);
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await isBaseMap2Visible(page)).toBe(false);

        await setBaseMap2Visible(page, true);
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await isBaseMap2Visible(page)).toBe(true);
    });

    test('BaseMap modules including each layer group, including visibility changes', async ({ page }) => {
        const vectorTilesLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        for (const layerGroup of baseMapLayerGroupNames) {
            await initBasemap(page, { layerGroupsFilter: { mode: 'include', names: [layerGroup] } });
            const visibleLayers = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
            expect(visibleLayers).toBeGreaterThan(vectorTilesLayersCount - 20);

            await setBaseMapVisible(page, false);
            const visibleLayersAfterModuleInvisible = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // (only some layers became invisible):
            expect(visibleLayersAfterModuleInvisible).toBeGreaterThan(0);
            // (there might be some layers which are hidden by default in the style)
            if (layerGroup === 'buildings3D') {
                expect(visibleLayersAfterModuleInvisible).toBeLessThanOrEqual(visibleLayers);
            } else {
                expect(visibleLayersAfterModuleInvisible).toBeLessThan(visibleLayers);
            }

            await setBaseMapVisible(page, true);
            const visibleLayersAfterModuleVisible = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // all layers are visible again:
            // (there might be some layers which are hidden by default in the style so here we might end up with more visible layers than before)
            expect(visibleLayersAfterModuleVisible).toBeGreaterThanOrEqual(visibleLayers);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('BaseMap modules excluding each layer group, including visibility changes', async ({ page }) => {
        const vectorTilesLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        for (const layerGroup of baseMapLayerGroupNames) {
            await initBasemap(page, { layerGroupsFilter: { mode: 'exclude', names: [layerGroup] } });
            const visibleLayers = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
            expect(visibleLayers).toBeGreaterThan(vectorTilesLayersCount - 20);

            await setBaseMapVisible(page, false);
            const visibleLayersAfterModuleInvisible = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // (only some layers became invisible):
            expect(visibleLayersAfterModuleInvisible).toBeGreaterThan(0);
            expect(visibleLayersAfterModuleInvisible).toBeLessThan(visibleLayers);

            await setBaseMapVisible(page, true);
            const visibleLayersAfterModuleVisible = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // all layers are visible again:
            // (there might be some layers which are hidden by default in the style so here we might end up with more visible layers than before)
            expect(visibleLayersAfterModuleVisible).toBeGreaterThanOrEqual(visibleLayers);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
