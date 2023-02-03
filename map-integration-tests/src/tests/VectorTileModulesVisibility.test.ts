import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import { HILLSHADE_SOURCE_ID, POI_SOURCE_ID } from "map";
import { assertNumber, assertTrafficVisibility, getNumVisibleLayersBySource } from "./util/TestUtils";

describe("Vector tile modules combined visibility tests, to ensure one module doesn't step on another", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const assertPOIsVisibility = async (poisVisible: boolean) =>
        assertNumber(await getNumVisibleLayersBySource(POI_SOURCE_ID), poisVisible);

    const assertHillshadeVisibility = async (hillshadeVisible: boolean) =>
        assertNumber(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID), hillshadeVisible);

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
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setIncidentsVisible(false));
        await assertTrafficVisibility(false, true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setFlowVisible(false));
        await assertTrafficVisibility(false, false);

        // re-setting configs (thus expecting default to be re-applied)
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.resetConfig());
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.resetConfig());
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.resetConfig());
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
