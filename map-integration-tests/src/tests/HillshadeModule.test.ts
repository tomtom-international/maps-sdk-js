import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getNumVisibleLayersBySource, isLayerVisible, waitForMapReady } from "./util/TestUtils";
import { HILLSHADE_SOURCE_ID, POI_SOURCE_ID, VECTOR_TILES_FLOW_SOURCE_ID, VECTOR_TILES_INCIDENTS_SOURCE_ID } from "map";

describe("Map vector tiles hillshade module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Failing to initialize if excluded from the style", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });
        await expect(
            page.evaluate(async () => {
                const mapsSDKThis = globalThis as MapsSDKThis;
                await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap);
            })
        ).rejects.toBeDefined();
    });

    test("Success to initialize if not included in the style, but auto adding it", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
        });

        await waitForMapReady();
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toEqual(0);
        // double-checking against base-map "default" POIs:
        expect(await isLayerVisible("POI")).toBe(false);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Success to initialize if included in the style, also with auto-inclusion flag (ignored)", async () => {
        await mapEnv.loadMap(
            { center: [7.12621, 48.50394], zoom: 8 },
            { style: { type: "published", include: ["hillshade"] } }
        );

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
        });

        await waitForMapReady();
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toEqual(0);
        // double-checking against base-map "default" POIs:
        expect(await isLayerVisible("POI")).toBe(false);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles hillshade visibility changes in different ways", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["hillshade"] } }
        );

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.hillshade = await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, {
                visible: false
            });
        });
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.applyConfig({}));
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
