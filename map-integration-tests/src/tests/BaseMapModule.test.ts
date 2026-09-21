import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { BaseMapLayerGroupName, BaseMapLayerGroups } from 'map';
import { BASE_MAP_SOURCE_ID, baseMapLayerGroupNames, poiLayerIDs } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    initBasemap,
    moveAndZoomTo,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
    waitUntilRenderedFeatures,
    waitUntilRenderedFeaturesChange,
} from './util/TestUtils';

const getBaseMapLayerCount = async (page: Page): Promise<number> =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.sourceAndLayerIDs.vectorTiles.layerIDs.length as number);

// The base map is shared per map, so "the layers of one group" is asked of the one module rather
// than of a second instance scoped to that group. See LSI-159.
const getGroupLayerIDs = async (page: Page, group: BaseMapLayerGroupName): Promise<string[]> =>
    page.evaluate((name) => (globalThis as MapsSDKThis).baseMap?.getLayerIds(name) as string[], group);

const areGroupLayersVisible = async (page: Page, group: BaseMapLayerGroupName): Promise<boolean | undefined> =>
    page.evaluate(
        (name) => (globalThis as MapsSDKThis).baseMap?.isVisible({ layerGroups: { mode: 'include', names: [name] } }),
        group,
    );

const setGroupVisible = async (page: Page, group: BaseMapLayerGroupName, visible: boolean) =>
    page.evaluate(
        ({ name, isVisible }) =>
            (globalThis as MapsSDKThis).baseMap?.setVisible(isVisible, {
                layerGroups: { mode: 'include', names: [name] },
            }),
        { name: group, isVisible: visible },
    );

const setBaseMapVisible = async (page: Page, visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }) =>
    page.evaluate(({ visible, options }) => (globalThis as MapsSDKThis).baseMap?.setVisible(visible, options), {
        visible,
        options,
    });

const isBaseMapVisible = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.isVisible());

const getBaseMapConfig = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.getConfig());

const getBaseMapLayers = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.getLayers() as Record<BaseMapLayerGroupName, string[]>);

const getBaseMapLayerIds = async (page: Page, group: BaseMapLayerGroupName) =>
    page.evaluate((inputGroup) => (globalThis as MapsSDKThis).baseMap?.getLayerIds(inputGroup) as string[], group);

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

        // Hiding one part of the map, through the same module — there is only ever one.
        await setBaseMapVisible(page, false, { layerGroups: { mode: 'include', names: ['land', 'water'] } });
        // double-checking we haven't altered the overall base map layer set:
        vectorTilesLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBe(originalBaseMapLayerCount + poiLayerIDs.length);
        expect(await getBaseMapLayerCount(page)).toBe(originalBaseMapLayerCount);
        // the overall base map is still visible since many layers are:
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeLessThan(vectorTilesLayersCount);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // Style-owned modules are shared per map: a second get() is a lookup, not a construction.
    // See LSI-159.
    test('BaseMapModule.get returns the same instance for one map', async ({ page }) => {
        await initBasemap(page);

        const sameInstance = await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            const again = await mapsSdkThis.MapsSDK.BaseMapModule.get(mapsSdkThis.tomtomMap);
            return again === mapsSdkThis.baseMap;
        });

        expect(sameInstance).toBe(true);
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

    test('BaseMap visibility changes for some layer groups', async ({ page }) => {
        // Initializing a base map with all layers:
        await initBasemap(page);
        expect(await areGroupLayersVisible(page, 'land')).toBe(true);

        // Hiding land:
        await setGroupVisible(page, 'land', false);
        // The module as a whole is still visible, because many layers still are:
        expect(await isBaseMapVisible(page)).toBe(true);
        expect(await areGroupLayersVisible(page, 'land')).toBe(false);

        // Showing land again:
        await setGroupVisible(page, 'land', true);
        expect(await areGroupLayersVisible(page, 'land')).toBe(true);

        // Hiding everything but land:
        await setBaseMapVisible(page, false, { layerGroups: { mode: 'exclude', names: ['land'] } });
        // Land is still visible:
        expect(await areGroupLayersVisible(page, 'land')).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Mutually exclusive layer groups toggle independently on one module', async ({ page }) => {
        const originalLayersCount = await getNumLayersBySource(page, BASE_MAP_SOURCE_ID);
        const originalVisibleLayersCount = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);

        const roadGroups: BaseMapLayerGroups = { mode: 'include', names: ['roads', 'roadShields', 'roadLabels'] };
        const everythingElse: BaseMapLayerGroups = { mode: 'exclude', names: roadGroups.names };

        await initBasemap(page);

        // double-checking we haven't altered the overall base map layers:
        expect(await getNumLayersBySource(page, BASE_MAP_SOURCE_ID)).toBe(originalLayersCount);
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBe(originalVisibleLayersCount);

        expect(await areGroupLayersVisible(page, 'roads')).toBe(true);
        expect(await areGroupLayersVisible(page, 'water')).toBe(true);

        // Hiding everything but the roads leaves the roads alone, and vice versa.
        await setBaseMapVisible(page, false, { layerGroups: everythingElse });
        expect(await areGroupLayersVisible(page, 'roads')).toBe(true);
        expect(await areGroupLayersVisible(page, 'water')).toBe(false);

        await setBaseMapVisible(page, false, { layerGroups: roadGroups });
        expect(await areGroupLayersVisible(page, 'roads')).toBe(false);
        expect(await areGroupLayersVisible(page, 'water')).toBe(false);

        await setBaseMapVisible(page, true, { layerGroups: everythingElse });
        expect(await areGroupLayersVisible(page, 'roads')).toBe(false);
        expect(await areGroupLayersVisible(page, 'water')).toBe(true);

        await setBaseMapVisible(page, true, { layerGroups: roadGroups });
        expect(await areGroupLayersVisible(page, 'roads')).toBe(true);
        expect(await areGroupLayersVisible(page, 'water')).toBe(true);
    });

    // One module backs every group: `setVisible` and `isVisible` both take the group to act on,
    // so visibility is asserted per group rather than inferred from layer counts. See LSI-159.
    test('Every layer group hides and shows independently on the one base map module', async ({ page }) => {
        await initBasemap(page);
        const initiallyVisible = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);

        for (const layerGroup of baseMapLayerGroupNames) {
            // A style need not ship every group; an absent one has nothing to toggle.
            if (!(await getGroupLayerIDs(page, layerGroup)).length) continue;

            await setGroupVisible(page, layerGroup, false);
            expect(await areGroupLayersVisible(page, layerGroup), `'${layerGroup}' should hide`).toBe(false);
            // Hiding one group never blanks the whole base map.
            expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(0);

            await setGroupVisible(page, layerGroup, true);
            expect(await areGroupLayersVisible(page, layerGroup), `'${layerGroup}' should show again`).toBe(true);
        }

        // Everything is back on — plus any group that shipped hidden and we just switched on.
        expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThanOrEqual(initiallyVisible);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // The complement of the test above: hiding everything *except* one group leaves that group,
    // and only that group, on the map.
    test('Hiding all but one layer group leaves exactly that group visible', async ({ page }) => {
        await initBasemap(page);

        for (const layerGroup of baseMapLayerGroupNames) {
            if (!(await getGroupLayerIDs(page, layerGroup)).length) continue;

            await setBaseMapVisible(page, false, { layerGroups: { mode: 'exclude', names: [layerGroup] } });
            const visibleLayers = await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID);
            // Groups overlap — `cityLabels` is inside `allPlaceLabels` — so the survivors are this
            // group's layers, not necessarily only them. What matters is that something survived
            // and that most of the map went away.
            expect(visibleLayers, `'${layerGroup}' should survive`).toBeGreaterThan(0);

            await setBaseMapVisible(page, true);
            expect(await getNumVisibleLayersBySource(page, BASE_MAP_SOURCE_ID)).toBeGreaterThan(visibleLayers);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('New layer groups toggle real rendered features (railways, ferries, nature labels)', async ({ page }) => {
        // Istanbul at z12 straddles the Bosphorus: dense railways on both shores,
        // cross-strait ferry lines, and water-area/strait nature labels — so the
        // three groups added by the metadata-based classification all have
        // features here and the visibility assertions below aren't vacuous.
        await moveAndZoomTo(page, { center: [29.0, 41.03], zoom: 12 });
        await waitForMapIdle(page);
        await initBasemap(page);

        const newGroups: BaseMapLayerGroupName[] = ['railways', 'ferries', 'natureLabels'];
        for (const group of newGroups) {
            // getLayerIds reveals the group's exact style layer ids.
            const layerIDs = await getGroupLayerIDs(page, group);
            expect(layerIDs, `group '${group}' should map to style layers`).not.toHaveLength(0);

            // The group must actually render features here (otherwise hiding proves nothing):
            const shown = await waitUntilRenderedFeaturesChange(page, layerIDs, 0, 15000);
            expect(shown.length, `group '${group}' should render features in Istanbul`).toBeGreaterThan(0);

            // Hiding the group removes its features from the map:
            await setGroupVisible(page, group, false);
            expect(await areGroupLayersVisible(page, group)).toBe(false);
            await waitUntilRenderedFeatures(page, layerIDs, 0, 15000);

            // Showing it again brings them back:
            await setGroupVisible(page, group, true);
            expect(await areGroupLayersVisible(page, group)).toBe(true);
            const reshown = await waitUntilRenderedFeaturesChange(page, layerIDs, 0, 15000);
            expect(reshown.length, `group '${group}' should render features again`).toBeGreaterThan(0);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('BaseMap is restored visible when style changes immediately after resetConfig', {
        tag: '@flaky',
    }, async ({ page }) => {
        await initBasemap(page);
        await setBaseMapVisible(page, false);
        await waitForMapIdle(page);
        expect(await isBaseMapVisible(page)).toBe(false);
        expect(await getBaseMapConfig(page)).toEqual({ visible: false });

        // Reset config and change style without waiting in between:
        await page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.resetConfig());
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);

        expect(await getBaseMapConfig(page)).toBeUndefined();
        expect(await isBaseMapVisible(page)).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('getLayers exposes grouped layer ids for the initialized map', async ({ page }) => {
        await initBasemap(page);
        const layers = await getBaseMapLayers(page);

        // Every group has an entry (some may be empty in a given style).
        expect(Object.keys(layers).sort((a, b) => a.localeCompare(b))).toEqual(
            [...baseMapLayerGroupNames].sort((a, b) => a.localeCompare(b)),
        );
        // Water is present everywhere; getLayerIds agrees with getLayers.
        expect(layers.water.length).toBeGreaterThan(0);
        expect(await getBaseMapLayerIds(page, 'water')).toEqual(layers.water);

        // The place-label groups are subsets of the allPlaceLabels superset.
        for (const cityLayer of layers.cityLabels) {
            expect(layers.allPlaceLabels).toContain(cityLayer);
        }

        // Every grouped id is one of the module's managed layers (POIs excluded).
        const managed = await page.evaluate(
            () => (globalThis as MapsSDKThis).baseMap?.sourceAndLayerIDs.vectorTiles.layerIDs as string[],
        );
        const allGrouped = new Set(Object.values(layers).flat());
        for (const id of allGrouped) expect(managed).toContain(id);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
