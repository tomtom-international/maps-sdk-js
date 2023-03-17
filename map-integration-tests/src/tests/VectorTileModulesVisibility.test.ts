import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
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
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.traffic = await mapsSDKThis.MapsSDK.VectorTilesTraffic.init(mapsSDKThis.tomtomMap, {
                visible: false
            });
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.VectorTilePOIs.init(mapsSDKThis.tomtomMap, {
                visible: false
            });
            mapsSDKThis.hillshade = await mapsSDKThis.MapsSDK.VectorTilesHillshade.init(mapsSDKThis.tomtomMap, {
                visible: false
            });
        });

        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: false });
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: false });
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.setIncidentIconsVisible(false));
        await assertTrafficVisibility({ incidents: true, incidentIcons: false, flow: true });
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.setFlowVisible(false));
        await assertTrafficVisibility({ incidents: true, incidentIcons: false, flow: false });
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        // re-setting configs (thus expecting default to be re-applied)
        await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
