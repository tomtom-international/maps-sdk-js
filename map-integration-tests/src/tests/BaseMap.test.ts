import { BASE_MAP_SOURCE_ID } from "map/src/shared";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getNumVisibleLayersBySource, initBasemap } from "./util/TestUtils";

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
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBeGreaterThanOrEqual(87);

        await page.evaluate(() => (globalThis as MapsSDKThis).basemap?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).basemap?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(BASE_MAP_SOURCE_ID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
