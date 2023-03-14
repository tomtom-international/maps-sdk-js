import { GOSDKThis } from "./types/GOSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getNumVisibleLayersBySource } from "./util/TestUtils";
import { HILLSHADE_SOURCE_ID } from "map";

describe("Map vector tiles hillshade module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Failing to initialize if excluded from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394],
                zoom: 15
            },
            {
                style: { type: "published", exclude: ["hillshade"] }
            }
        );

        await expect(
            page.evaluate(async () => {
                const goSDKThis = globalThis as GOSDKThis;
                await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap);
            })
        ).rejects.toBeDefined();
    });

    test("Vector tiles hillshade visibility changes in different ways", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.hillshade = await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap, {
                visible: false
            });
        });
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.resetConfig());
        expect(await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.applyConfig({}));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.resetConfig());
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
