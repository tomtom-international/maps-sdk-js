import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { HILLSHADE_SOURCE_ID } from "map";
import { assertNumber, getNumVisibleLayersBySource, getNumVisiblePOILayers } from "./util/TestUtils";

describe("Vector tile modules combined visibility tests, to ensure one module doesn't step on another", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const assertPOIsVisibility = async (poisVisible: boolean) =>
        assertNumber(await getNumVisiblePOILayers(), poisVisible);

    const assertHillshadeVisibility = async (hillshadeVisible: boolean) =>
        assertNumber(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID), hillshadeVisible);

    test("Vector tiles traffic/pois/hillshade visibility", async () => {
        await mapEnv.loadMap(
            {
                zoom: 14,
                center: [-0.12621, 51.50394]
            },
            {
                style: { type: "published", include: ["trafficIncidents", "trafficFlow", "hillshade"] }
            }
        );
        await page.evaluate(async () => {
            const sdkThis = globalThis as MapsSDKThis;
            sdkThis.trafficIncidents = await sdkThis.MapsSDK.TrafficIncidentsModule.get(sdkThis.tomtomMap, {
                visible: false
            });
            sdkThis.trafficFlow = await sdkThis.MapsSDK.TrafficFlowModule.get(sdkThis.tomtomMap, { visible: false });
            sdkThis.pois = await sdkThis.MapsSDK.POIsModule.get(sdkThis.tomtomMap, { visible: false });
            sdkThis.hillshade = await sdkThis.MapsSDK.HillshadeModule.get(sdkThis.tomtomMap, { visible: false });
        });

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        // re-setting configs (thus expecting default to be re-applied)
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
