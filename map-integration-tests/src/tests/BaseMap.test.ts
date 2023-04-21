import { VECTOR_TILES_SOURCE_ID, VectorTileMapModuleConfig } from "map/src/shared";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getNumVisibleLayersBySource } from "./util/TestUtils";

const initBasemap = async (config?: VectorTileMapModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.basemap = await mapsSDKThis.MapsSDK.BaseMapModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config as never);

describe("BaseMap module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());
    beforeEach(async () => {
        await page.evaluate(() => {
            const mapSDKThis = globalThis as MapsSDKThis;
            mapSDKThis._numOfClicks = 0;
        });

        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });

        await initBasemap();
    });

    test("BaseMap visibility changes", async () => {
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_SOURCE_ID)).toBeGreaterThanOrEqual(87);

        await page.evaluate(() => (globalThis as MapsSDKThis).basemap?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).basemap?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_SOURCE_ID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
