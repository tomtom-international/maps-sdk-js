import type { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import {
    getNumVisibleLayersBySource,
    initHillshade,
    setStyle,
    waitForMapIdle,
    waitForMapReady
} from "./util/TestUtils";
import { HILLSHADE_SOURCE_ID, TRAFFIC_FLOW_SOURCE_ID, TRAFFIC_INCIDENTS_SOURCE_ID } from "map";

describe("Map vector tiles hillshade module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Failing to initialize if excluded from the style", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });
        await expect(initHillshade()).rejects.toBeDefined();
    });

    test("Success to initialize if not included in the style, but auto adding it", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });
        await initHillshade({ ensureAddedToStyle: true });
        await waitForMapReady();
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Success to initialize if included in the style, also with auto-inclusion flag (ignored)", async () => {
        await mapEnv.loadMap(
            { center: [7.12621, 48.50394], zoom: 8 },
            { style: { type: "published", include: ["hillshade"] } }
        );
        await initHillshade({ ensureAddedToStyle: true });
        await waitForMapReady();

        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);
        expect(await getNumVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID)).toEqual(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID)).toEqual(0);
        // TODO: POIs are included in the base map for now
        // expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toEqual(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles hillshade visibility changes in different ways", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["hillshade"] } }
        );

        await initHillshade({ visible: false });
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

        // changing style at runtime, verifying hillshade is still there:
        await setStyle("monoLight");
        await waitForMapIdle();
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
