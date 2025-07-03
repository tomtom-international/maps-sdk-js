import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { FlowConfig, RoadCategory, StyleModuleInitConfig, TrafficFlowFilters } from 'map';
import { TRAFFIC_FLOW_SOURCE_ID } from 'map/src/shared';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { getVisibleLayersBySource, setStyle, waitForMapIdle, waitUntilRenderedFeaturesChange } from './util/TestUtils';

const waitForRenderedFlowChange = async (page: Page, previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(
        page,
        (await getVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).map((layer) => layer.id),
        previousFeaturesCount,
        10000,
    );

const getByRoadCategories = (renderedItems: MapGeoJSONFeature[], roadCategories: RoadCategory[]): MapGeoJSONFeature[] =>
    renderedItems.filter((incident) => roadCategories.includes(incident.properties['road_category']));

const initTrafficFlow = async (page: Page, config?: StyleModuleInitConfig & FlowConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.trafficFlow = await mapsSDKThis.MapsSDK.TrafficFlowModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

const isFlowVisible = async (page: Page): Promise<boolean> =>
    page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible() ?? false);

const setFlowVisible = async (page: Page, visible: boolean) =>
    page.evaluate((inputVisible) => (globalThis as MapsSDKThis).trafficFlow?.setVisible(inputVisible), visible);

const unsetTrafficFlow = async (page: Page) =>
    page.evaluate(() => ((globalThis as MapsSDKThis).trafficFlow = undefined));

const getFlowConfig = async (page: Page): Promise<FlowConfig | undefined> =>
    page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.getConfig());

const applyConfig = async (page: Page, config: FlowConfig | undefined) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).trafficFlow?.applyConfig(inputConfig), config);

const resetConfig = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.resetConfig());

test.describe('Map vector tile traffic module tests', () => {
    const mapEnv = new MapTestEnv();

    test.afterEach(async ({ page }) => unsetTrafficFlow(page));

    test('Failing to initialize if fully excluded from the style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, {});
        await expect(initTrafficFlow(page)).rejects.toBeDefined();
    });

    test('Auto initialize if fully excluded from the style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, {});
        await initTrafficFlow(page, { ensureAddedToStyle: true });
        expect(await page.evaluate(() => !!(globalThis as MapsSDKThis).trafficFlow)).toBe(true);
    });

    test('Vector tiles traffic visibility changes in different ways', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: 'published', include: ['trafficFlow'] } },
        );
        expect(await getFlowConfig(page)).toBeUndefined();

        await initTrafficFlow(page, { visible: false });
        expect(await getFlowConfig(page)).toEqual({ visible: false });
        expect(await isFlowVisible(page)).toBe(false);

        await setFlowVisible(page, true);
        expect(await getFlowConfig(page)).toEqual({ visible: true });
        expect(await isFlowVisible(page)).toBe(true);

        await setFlowVisible(page, false);
        expect(await getFlowConfig(page)).toEqual({ visible: false });
        expect(await isFlowVisible(page)).toBe(false);

        // re-applying config again:
        await applyConfig(page, await getFlowConfig(page));
        expect(await isFlowVisible(page)).toBe(false);

        await setFlowVisible(page, true);
        expect(await isFlowVisible(page)).toBe(true);
        expect(await getFlowConfig(page)).toEqual({
            visible: true,
        });

        await applyConfig(page, { visible: undefined });
        expect(await isFlowVisible(page)).toBe(true);

        await resetConfig(page);
        expect(await isFlowVisible(page)).toBe(true);
        expect(await getFlowConfig(page)).toBeUndefined();

        // changing the map style: verifying the places are still shown (state restoration):
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        expect(await isFlowVisible(page)).toBe(true);

        await resetConfig(page);
        expect(await isFlowVisible(page)).toBe(true);
        expect(await getFlowConfig(page)).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Traffic flow filtering with initial config', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 12, center: [2.37327, 48.85903] },
            { style: { type: 'published', include: ['trafficFlow'] } },
        );

        const config: FlowConfig = {
            filters: {
                any: [{ roadCategories: { show: 'only', values: ['motorway'] }, showRoadClosures: 'all_except' }],
            },
        };

        await initTrafficFlow(page, config);
        expect(await getFlowConfig(page)).toEqual(config);
        expect(await isFlowVisible(page)).toBe(true);
        await waitForMapIdle(page);
        const renderedFlowSegments = await waitForRenderedFlowChange(page, 0);

        // We only show for: "motorway", "trunk":
        expect(getByRoadCategories(renderedFlowSegments, ['motorway'])).toHaveLength(renderedFlowSegments.length);
        expect(renderedFlowSegments.filter((segment) => segment.properties['road_closure'] === true)).toHaveLength(0);

        // Showing flow in road closures only:
        const flowFilters: TrafficFlowFilters = { any: [{ showRoadClosures: 'only' }] };
        await page.evaluate(
            async (inputFlowFilters) => (globalThis as MapsSDKThis).trafficFlow?.filter(inputFlowFilters),
            flowFilters,
        );
        expect(await getFlowConfig(page)).toEqual({ filters: flowFilters });
        await waitForMapIdle(page);

        const renderedRoadClosures = await waitForRenderedFlowChange(page, renderedFlowSegments.length);
        expect(renderedRoadClosures.filter((segment) => segment.properties['road_closure'] === true)).toHaveLength(
            renderedRoadClosures.length,
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Traffic flow filtering with complex initial config', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: 'published', include: ['trafficFlow'] } },
        );

        const config: FlowConfig = {
            filters: {
                any: [
                    {
                        roadCategories: { show: 'only', values: ['motorway', 'trunk', 'primary'] },
                        showRoadClosures: 'all_except',
                    },
                ],
            },
        };

        await initTrafficFlow(page, config);
        expect(await getFlowConfig(page)).toEqual(config);
        await waitForMapIdle(page);

        // FLOW assertions:
        let renderedFlowSegments = await waitForRenderedFlowChange(page, 0);
        expect(renderedFlowSegments.length).toBeGreaterThan(5);

        // We only show for: "motorway", "trunk", "primary"
        expect(getByRoadCategories(renderedFlowSegments, ['motorway', 'trunk', 'primary'])).toHaveLength(
            renderedFlowSegments.length,
        );
        expect(getByRoadCategories(renderedFlowSegments, ['secondary', 'tertiary', 'street'])).toHaveLength(0);

        // CHANGING THE MAP STYLE: verifying the config is still the same (state restoration):
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        expect(await getFlowConfig(page)).toEqual(config);
        // FLOW assertions:
        renderedFlowSegments = await waitForRenderedFlowChange(page, 0);
        expect(getByRoadCategories(renderedFlowSegments, ['motorway', 'trunk', 'primary'])).toHaveLength(
            renderedFlowSegments.length,
        );
        expect(getByRoadCategories(renderedFlowSegments, ['secondary', 'tertiary', 'street'])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // (We'll verify that using dedicated methods for filtering and visibility do not affect each other)
    test('Traffic visibility and filtering with dedicated methods', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            // London:
            { zoom: 12, center: [-0.12621, 51.50394] },
            { style: { type: 'published', include: ['trafficFlow'] } },
        );

        await initTrafficFlow(page);
        await setFlowVisible(page, false);

        const flowFilters: TrafficFlowFilters = { any: [{ roadCategories: { show: 'only', values: ['primary'] } }] };
        // Showing flow in primary roads only:
        await page.evaluate(
            async (inputFlowFilters) => (globalThis as MapsSDKThis).trafficFlow?.filter(inputFlowFilters),
            flowFilters,
        );
        expect(await getFlowConfig(page)).toEqual({
            visible: false,
            filters: flowFilters,
        });

        // (changing flow filter directly shouldn't affect flow visibility):
        expect(await isFlowVisible(page)).toBe(false);
        await setFlowVisible(page, true);
        expect(await getFlowConfig(page)).toEqual({
            visible: true,
            filters: flowFilters,
        });
        expect(await isFlowVisible(page)).toBe(true);

        await setFlowVisible(page, false);
        expect(await getFlowConfig(page)).toEqual({
            visible: false,
            filters: flowFilters,
        });

        await page.evaluate(async () => (globalThis as MapsSDKThis).trafficFlow?.filter());
        expect(await getFlowConfig(page)).toEqual({
            visible: false,
        });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
