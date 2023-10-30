import { baseMapLayerGroupNames, BaseMapModuleConfig } from "map";
import { BASE_MAP_SOURCE_ID } from "map/src/shared";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getNumLayersBySource, getNumVisibleLayersBySource, initBasemap, waitForMapReady } from "./util/TestUtils";

const initBasemap2 = async (config?: BaseMapModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.baseMap2 = await mapsSDKThis.MapsSDK.BaseMapModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

const getBaseMapLayerCount = async () =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.sourceAndLayerIDs.vectorTiles.layerIDs.length);

const getBaseMap2LayerCount = async () =>
    page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.sourceAndLayerIDs.vectorTiles.layerIDs.length);

const setBaseMapVisible = async (visible: boolean) =>
    page.evaluate((visibleInput) => (globalThis as MapsSDKThis).baseMap?.setVisible(visibleInput), visible);

const isBaseMapVisible = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap?.isVisible());

const setBaseMap2Visible = async (visible: boolean) =>
    page.evaluate((visibleInput) => (globalThis as MapsSDKThis).baseMap2?.setVisible(visibleInput), visible);

const isBaseMap2Visible = async () => page.evaluate(() => (globalThis as MapsSDKThis).baseMap2?.isVisible());

describe("BaseMap module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());
    beforeEach(async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapReady();
    });

    test("BaseMap modules and visibility changes", async () => {
        await initBasemap();
        let vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBeGreaterThanOrEqual(87);
        // The number of visible style layers should be close to the total amount (but some style layers might be hidden by default):
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(vectorTilesLayersCount - 5);
        // This base map contains all the vector tile layers:
        const originalBaseMapLayerCount = await getBaseMapLayerCount();
        expect(originalBaseMapLayerCount).toBe(vectorTilesLayersCount);

        await setBaseMapVisible(false);
        expect(await isBaseMapVisible()).toBe(false);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBe(0);

        // (making the base map visible again)
        await setBaseMapVisible(true);
        expect(await getBaseMapLayerCount()).toBe(originalBaseMapLayerCount);

        // ANOTHER BASE MAP MODULE INSTANCE WITH LAYER GROUPS:
        await initBasemap2({ layerGroups: ["land", "water"] });
        // double-checking we haven't altered the overall visible base map layers:
        vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        expect(vectorTilesLayersCount).toBe(originalBaseMapLayerCount);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(vectorTilesLayersCount - 5);
        expect(await getBaseMapLayerCount()).toBe(originalBaseMapLayerCount);
        // the second base map module should have just a subset of the overall layers:
        expect(await getBaseMap2LayerCount()).toBeLessThan(vectorTilesLayersCount / 2);

        // we make the second base map module instance invisible, which should hide only some layers:
        await setBaseMap2Visible(false);
        expect(await isBaseMap2Visible()).toBe(false);
        // (the overall base map is still visible since some layer are still visible):
        expect(await isBaseMapVisible()).toBe(true);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeLessThan(vectorTilesLayersCount);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("BaseMap modules with each layer group, including visibility changes", async () => {
        const vectorTilesLayersCount = await getNumLayersBySource(BASE_MAP_SOURCE_ID);
        for (const layerGroup of baseMapLayerGroupNames) {
            await initBasemap({ layerGroups: [layerGroup] });
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
});
