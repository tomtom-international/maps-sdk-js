import { getNumVisibleLayersBySource, MapIntegrationTestEnv, waitForMapToLoad } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";

describe("Map vector layer tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    const assertNumLayers = (numLayers: number, positiveVsZero: boolean) => {
        if (positiveVsZero) {
            expect(numLayers).toBeGreaterThan(0);
        } else {
            expect(numLayers).toStrictEqual(0);
        }
    };

    const assertTrafficVisibility = async (incidentsVisible: boolean, flowVisible: boolean) => {
        assertNumLayers(await getNumVisibleLayersBySource("vectorTilesIncidents"), incidentsVisible);
        assertNumLayers(await getNumVisibleLayersBySource("vectorTilesFlow"), flowVisible);
    };

    const assertPOIsVisibility = async (poisVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource("poiTiles"), poisVisible);

    const assertHillshadeVisibility = async (hillshadeVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource("hillshade"), hillshadeVisible);

    // eslint-disable-next-line jest/expect-expect
    test("Vector tiles traffic/pois/hillshade visibility", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = new goSDKThis.GOSDK.VectorTilesTraffic(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.pois = new goSDKThis.GOSDK.VectorTilePOIs(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.hillshade = new goSDKThis.GOSDK.VectorTilesHillshade(goSDKThis.goSDKMap, { visible: false });
        });
        await waitForMapToLoad();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(true));
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(false));
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(false));
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(false));
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleIncidentsVisibility());
        await assertTrafficVisibility(false, true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleFlowVisibility());
        await assertTrafficVisibility(false, false);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.toggleVisibility());
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.toggleVisibility());
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Vector tiles traffic/pois/hillshade visibility with setVisible before waiting for map to load", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = new goSDKThis.GOSDK.VectorTilesTraffic(goSDKThis.goSDKMap).setVisible(false);
            goSDKThis.pois = new goSDKThis.GOSDK.VectorTilePOIs(goSDKThis.goSDKMap).setVisible(false);
            goSDKThis.hillshade = new goSDKThis.GOSDK.VectorTilesHillshade(goSDKThis.goSDKMap).setVisible(false);
        });
        await waitForMapToLoad();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
