import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { HILLSHADE_SOURCE_ID } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { assertNumber, getNumVisibleLayersBySource, getNumVisiblePOILayers } from './util/TestUtils';

test.describe("Vector tile modules combined visibility tests, to ensure one module doesn't step on another", () => {
    const mapEnv = new MapTestEnv();

    const assertPoIsVisibility = async (page: Page, poisVisible: boolean) =>
        assertNumber(await getNumVisiblePOILayers(page), poisVisible);

    const assertHillshadeVisibility = async (page: Page, hillshadeVisible: boolean) =>
        assertNumber(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID), hillshadeVisible);

    test('Vector tiles traffic/pois/hillshade visibility', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            {
                zoom: 14,
                center: [-0.12621, 51.50394],
            },
            {
                style: { type: 'standard', include: ['trafficIncidents', 'trafficFlow', 'hillshade'] },
            },
        );
        await page.evaluate(async () => {
            const sdkThis = globalThis as MapsSDKThis;
            sdkThis.trafficIncidents = await sdkThis.MapsSDK.TrafficIncidentsModule.get(sdkThis.tomtomMap);
            sdkThis.trafficFlow = await sdkThis.MapsSDK.TrafficFlowModule.get(sdkThis.tomtomMap);
            sdkThis.pois = await sdkThis.MapsSDK.POIsModule.get(sdkThis.tomtomMap);
            sdkThis.hillshade = await sdkThis.MapsSDK.HillshadeModule.get(sdkThis.tomtomMap);
        });

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPoIsVisibility(page, false);
        await assertHillshadeVisibility(page, false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBe(true);
        await assertPoIsVisibility(page, true);
        await assertHillshadeVisibility(page, true);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(false));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPoIsVisibility(page, false);
        await assertHillshadeVisibility(page, false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible()),
        ).toBeFalsy();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBe(true);
        await assertPoIsVisibility(page, false);
        await assertHillshadeVisibility(page, false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await assertPoIsVisibility(page, false);
        await assertHillshadeVisibility(page, false);

        // re-setting configs (thus expecting default to be re-applied)
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.resetConfig());

        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBe(true);
        await assertPoIsVisibility(page, true);
        await assertHillshadeVisibility(page, true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
