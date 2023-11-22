import { BaseMapLayerGroupName, baseMapLayerGroupNames, BaseMapLayerGroups, poiLayerIDs } from "map";
import { BASE_MAP_SOURCE_ID } from "map/src/shared";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import {
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    initBasemap,
    initBasemap2,
    waitForMapReady
} from "./util/TestUtils";

const getBaseMapLayerCount = async (): Promise<number> =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.sourceAndLayerIDs.vectorTiles.layerIDs.length as number);

const getBaseMap2LayerCount = async (): Promise<number> =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.sourceAndLayerIDs.vectorTiles.layerIDs.length as number);

const setBaseMapVisible = async (visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }) =>
    page.evaluate(
        (visibleInput, optionsInput) => (globalThis as MapsSDKThis).baseMap?.setVisible(visibleInput, optionsInput),
        visible,
        options
    );

const isBaseMapVisible = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.isVisible());

const getBaseMapConfig = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.getConfig());

const setBaseMap2Visible = async (visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }) =>
    page.evaluate(
        (visibleInput, optionsInput) => (globalThis as MapsSDKThis).baseMap2?.setVisible(visibleInput, optionsInput),
        visible,
        options
    );

const isBaseMap2Visible = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.isVisible());

const getBaseMap2Config = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.getConfig());

describe("BaseMap module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());
    beforeEach(async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapReady();
    });

    test("BaseMap modules and multiple visibility changes", async () => {
        await initBasemap();
        expect(await getBaseMapConfig()).toBeUndefined();
        let vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBeGreaterThanOrEqual(87);
        // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(vectorTilesLayersCount - 5);
        // This base map contains all the vector tile layers minus the POIs:
        const originalBaseMapLayerCount = await getBaseMapLayerCount();
        expect(originalBaseMapLayerCount).toBe(vectorTilesLayersCount - poiLayerIDs.length);

        await setBaseMapVisible(false);
        expect(await getBaseMapConfig()).toEqual({ visible: false });
        expect(await isBaseMapVisible()).toBe(false);
        // we hid the base map (but the POI layers remain):
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBe(poiLayerIDs.length);

        // (making the base map visible again)
        await setBaseMapVisible(true);
        expect(await getBaseMapConfig()).toEqual({ visible: true });
        expect(await getBaseMapLayerCount()).toBe(originalBaseMapLayerCount);

        // ANOTHER BASE MAP MODULE INSTANCE WITH LAYER GROUPS FILTERED:
        await initBasemap2({ layerGroupsFilter: { mode: "include", names: ["land", "water"] } });
        expect(await getBaseMap2Config()).toEqual({ layerGroupsFilter: { mode: "include", names: ["land", "water"] } });
        // double-checking we haven't altered the overall visible base map layers:
        vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBe(originalBaseMapLayerCount + poiLayerIDs.length);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(vectorTilesLayersCount - 5);
        expect(await getBaseMapLayerCount()).toBe(originalBaseMapLayerCount);
        // the second base map module should have just a subset of the overall layers:
        expect(await getBaseMap2LayerCount()).toBeLessThan(vectorTilesLayersCount / 2);

        // we make the second base map module instance invisible, which should hide only some layers:
        await setBaseMap2Visible(false);
        expect(await getBaseMap2Config()).toEqual({
            visible: false,
            layerGroupsFilter: { mode: "include", names: ["land", "water"] }
        });
        expect(await isBaseMap2Visible()).toBe(false);
        // (the overall base map is still visible since some layer are still visible):
        expect(await isBaseMapVisible()).toBe(true);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeLessThan(vectorTilesLayersCount);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("BaseMap module and visibility changes for some layer groups", async () => {
        // Initializing a base map with all layers:
        await initBasemap();
        const visibleBaseMapLayers = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
        // Hiding road shields:
        await setBaseMapVisible(false, { layerGroups: { mode: "include", names: ["roadShields"] } });

        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeLessThan(visibleBaseMapLayers);
        // we should only have a few layers less visible:
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(visibleBaseMapLayers - 5);
        await setBaseMapVisible(true);
        // (3D buildings usually are invisible by default, so we end up with an extra visible layer)
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBe(visibleBaseMapLayers + 1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("BaseMap modules and visibility changes for some layer groups", async () => {
        // Initializing a base map with all layers:
        await initBasemap();
        await initBasemap2({ layerGroupsFilter: { mode: "include", names: ["land"] } });
        expect(await getBaseMap2Config()).toEqual({ layerGroupsFilter: { mode: "include", names: ["land"] } });

        // Hiding land via the first generic base map module:
        await setBaseMapVisible(false, { layerGroups: { mode: "include", names: ["land"] } });
        // The first base map module should be visible because many layers are still visible:
        expect(await isBaseMapVisible()).toBe(true);
        // The second base map module, based only on land, should be now invisible:
        expect(await isBaseMap2Visible()).toBe(false);
        // Caveat: even if it's invisible, the config of the second base map doesn't state invisibility, since it was changed via another map module:
        expect(await getBaseMap2Config()).toEqual({ layerGroupsFilter: { mode: "include", names: ["land"] } });

        // Showing land again:
        await setBaseMapVisible(true, { layerGroups: { mode: "include", names: ["land"] } });
        expect(await isBaseMap2Visible()).toBe(true);

        // Hiding everything but land:
        await setBaseMapVisible(false, { layerGroups: { mode: "exclude", names: ["land"] } });
        // Land module still visible:
        expect(await isBaseMap2Visible()).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Two BaseMap modules with mutually exclusive groups", async () => {
        const originalLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        const originalVisibleLayersCount = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);

        const names: BaseMapLayerGroupName[] = ["roadLines", "roadShields", "roadLabels"];

        // "foundation" base map excluding roads:
        await initBasemap({ layerGroupsFilter: { mode: "exclude", names } });
        // second base map with roads only (should be mutually exclusive):
        await initBasemap2({ layerGroupsFilter: { mode: "include", names } });

        // double-checking we haven't altered the overall base map layers:
        expect(await getNumLayersBySource(BASE_MAP_SOURCE_ID)).toBe(originalLayersCount);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBe(originalVisibleLayersCount);

        // changing visibilities and ensuring one base map doesn't affect the other:
        expect(await isBaseMapVisible()).toBe(true);
        expect(await isBaseMap2Visible()).toBe(true);

        await setBaseMapVisible(false);
        expect(await isBaseMapVisible()).toBe(false);
        expect(await isBaseMap2Visible()).toBe(true);

        await setBaseMap2Visible(false);
        expect(await isBaseMapVisible()).toBe(false);
        expect(await isBaseMap2Visible()).toBe(false);

        await setBaseMapVisible(true);
        expect(await isBaseMapVisible()).toBe(true);
        expect(await isBaseMap2Visible()).toBe(false);

        await setBaseMap2Visible(true);
        expect(await isBaseMapVisible()).toBe(true);
        expect(await isBaseMap2Visible()).toBe(true);
    });

    test("BaseMap modules including each layer group, including visibility changes", async () => {
        const vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        for (const layerGroup of baseMapLayerGroupNames) {
            await initBasemap({ layerGroupsFilter: { mode: "include", names: [layerGroup] } });
            const visibleLayers = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
            expect(visibleLayers).toBeGreaterThan(vectorTilesLayersCount - 5);

            await setBaseMapVisible(false);
            const visibleLayersAfterModuleInvisible = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // (only some layers became invisible):
            expect(visibleLayersAfterModuleInvisible).toBeGreaterThan(0);
            // (there might be some layers which are hidden by default in the style)
            if (layerGroup == "buildings3D") {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(visibleLayersAfterModuleInvisible).toBeLessThanOrEqual(visibleLayers);
            } else {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(visibleLayersAfterModuleInvisible).toBeLessThan(visibleLayers);
            }

            await setBaseMapVisible(true);
            const visibleLayersAfterModuleVisible = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // all layers are visible again:
            // (there might be some layers which are hidden by default in the style so here we might end up with more visible layers than before)
            expect(visibleLayersAfterModuleVisible).toBeGreaterThanOrEqual(visibleLayers);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("BaseMap modules excluding each layer group, including visibility changes", async () => {
        const vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        for (const layerGroup of baseMapLayerGroupNames) {
            await initBasemap({ layerGroupsFilter: { mode: "exclude", names: [layerGroup] } });
            const visibleLayers = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
            expect(visibleLayers).toBeGreaterThan(vectorTilesLayersCount - 5);

            await setBaseMapVisible(false);
            const visibleLayersAfterModuleInvisible = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // (only some layers became invisible):
            expect(visibleLayersAfterModuleInvisible).toBeGreaterThan(0);
            expect(visibleLayersAfterModuleInvisible).toBeLessThan(visibleLayers);

            await setBaseMapVisible(true);
            const visibleLayersAfterModuleVisible = await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID);
            // all layers are visible again:
            // (there might be some layers which are hidden by default in the style so here we might end up with more visible layers than before)
            expect(visibleLayersAfterModuleVisible).toBeGreaterThanOrEqual(visibleLayers);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
