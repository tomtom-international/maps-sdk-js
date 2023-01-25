import { getNumVisibleLayersBySource, MapIntegrationTestEnv, waitForMapReady } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import { HILLSHADE_SOURCE_ID, POI_SOURCE_ID, VECTOR_TILES_FLOW_SOURCE_ID, VECTOR_TILES_INCIDENTS_SOURCE_ID } from "map";

describe("Vector tile modules combined visibility tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const assertNumLayers = (numLayers: number, positiveVsZero: boolean) => {
        if (positiveVsZero) {
            expect(numLayers).toBeGreaterThan(0);
        } else {
            expect(numLayers).toStrictEqual(0);
        }
    };

    const assertTrafficVisibility = async (incidentsVisible: boolean, flowVisible: boolean) => {
        assertNumLayers(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID), incidentsVisible);
        assertNumLayers(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID), flowVisible);
    };

    const assertPOIsVisibility = async (poisVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource(POI_SOURCE_ID), poisVisible);

    const assertHillshadeVisibility = async (hillshadeVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID), hillshadeVisible);

    const toggleAllVisibilities = async () => {
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.toggleVisibility());
    };

    test("Vector tiles traffic/pois/hillshade visibility", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.hillshade = await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap, {
                visible: false
            });
        });
        await waitForMapReady();
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

        await toggleAllVisibilities();
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await toggleAllVisibilities();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles traffic/pois/hillshade visibility with setVisible before waiting for map to load", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = (await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap)).setVisible(false);
            goSDKThis.pois = (await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap)).setVisible(false);
            goSDKThis.hillshade = (await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap)).setVisible(
                false
            );
        });
        await waitForMapReady();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
