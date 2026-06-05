import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { DelayMagnitude, TrafficIncidentCategory } from 'core';
import { fullTrafficIncidentCategories as availableIncidentCategories } from 'core';
import type { IncidentsConfig, RoadCategory, TrafficIncidentsFilters, TrafficIncidentsModuleFeature } from 'map';
import { TRAFFIC_INCIDENTS_SOURCE_ID } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getVisibleLayersBySource,
    initTrafficIncidents,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
} from './util/TestUtils';

const waitForShownIncidentsChange = async (
    page: Page,
    previousFeaturesCount: number,
): Promise<TrafficIncidentsModuleFeature[]> => {
    await page.waitForFunction(
        (prevCount) => {
            const shown = (globalThis as any).trafficIncidents?.getShown();
            return shown !== undefined && shown.trafficIncidents.length !== prevCount;
        },
        previousFeaturesCount,
        { timeout: 20000 },
    );
    return page.evaluate(() => (globalThis as any).trafficIncidents?.getShown()?.trafficIncidents ?? []);
};

const getByIncidentCategories = (
    incidents: TrafficIncidentsModuleFeature[],
    categories: TrafficIncidentCategory[],
): TrafficIncidentsModuleFeature[] => incidents.filter((incident) => categories.includes(incident.properties.category));

const getByRoadCategories = (
    incidents: TrafficIncidentsModuleFeature[],
    roadCategories: RoadCategory[],
): TrafficIncidentsModuleFeature[] =>
    incidents.filter((incident) => roadCategories.includes(incident.properties.roadCategory));

const getConfig = async (page: Page): Promise<IncidentsConfig | undefined> =>
    page.evaluate(async () => (globalThis as MapsSDKThis).trafficIncidents?.getConfig());

const applyConfig = async (page: Page, config: IncidentsConfig | undefined) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).trafficIncidents?.applyConfig(inputConfig), config);

const unsetIncidents = async (page: Page) =>
    page.evaluate(async () => ((globalThis as MapsSDKThis).trafficIncidents = undefined));

const resetConfig = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.resetConfig());

test.describe('Map vector tile traffic incidents module tests', () => {
    const mapEnv = new MapTestEnv();

    test.afterEach(async ({ page }) => unsetIncidents(page));

    test('Auto initialize if fully excluded from the style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, {}, { style: { type: 'standard', include: [] } });
        await initTrafficIncidents(page);
        expect(await page.evaluate(() => !!(globalThis as MapsSDKThis).trafficIncidents)).toBe(true);
    });

    test('Vector tiles traffic incidents visibility changes in different ways', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: 'standard', include: ['trafficIncidents'] } },
        );
        expect(await getConfig(page)).toBeUndefined();

        await initTrafficIncidents(page, { visible: false });
        expect(await getConfig(page)).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await getConfig(page)).toEqual({ visible: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await getConfig(page)).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(true));
        expect(await getConfig(page)).toEqual({ visible: false, icons: { visible: true } });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );

        // re-applying config again:
        await applyConfig(page, await getConfig(page));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );
        expect(await getConfig(page)).toEqual({ visible: false, icons: { visible: true } });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await getConfig(page)).toEqual({ visible: false });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible()),
        ).toBeFalsy();

        expect(await getConfig(page)).toEqual({
            visible: false,
            icons: { visible: false },
        });

        await applyConfig(page, { visible: undefined });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(false);

        await applyConfig(page, { visible: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await getConfig(page)).toEqual({ visible: true });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible()),
        ).toBeFalsy();
        expect(await getConfig(page)).toEqual({ visible: true, icons: { visible: false } });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );
        expect(await getConfig(page)).toEqual({ visible: true });

        await resetConfig(page);
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(false);
        expect(await getConfig(page)).toBeUndefined();

        // changing the map style: verifying the places are still shown (state restoration):
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        // The config was reset so the style reloads with traffic invisible for now:
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Traffic incidents icon visibility after style change', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await initTrafficIncidents(page);
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            false,
        );

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );

        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );
        expect((await getVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // TODO(LSI-263): Enable when flakyness has been fixed
    test('Traffic incidents filtering with config changes', { tag: '@flaky' }, async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 13, center: [-0.12621, 51.50394] }); // London
        await initTrafficIncidents(page, { visible: true });
        expect(await getConfig(page)).toEqual({ visible: true });
        await waitForMapIdle(page);

        const defaultIncidents = await waitForShownIncidentsChange(page, 0);
        expect(defaultIncidents.length).toBeGreaterThan(4);
        expect(getByIncidentCategories(defaultIncidents, ['road-closed']).length).toBeGreaterThan(0);

        let config: IncidentsConfig = {
            visible: true,
            filters: { any: [{ incidentCategories: { show: 'only', values: ['road-closed'] } }] },
        };

        // Showing road closures only:
        await applyConfig(page, config);
        expect(await getConfig(page)).toEqual(config);

        // changing the map style (and manually adding also poi part):
        // verifying the config is still the same (state restoration):
        await setStyle(page, 'standardDark');
        await waitForMapReady(page);
        await waitForMapIdle(page);
        expect(await getConfig(page)).toEqual(config);

        const roadClosedIncidents = await waitForShownIncidentsChange(page, 0);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ['road-closed'])).toHaveLength(roadClosedIncidents.length);
        expect(
            getByIncidentCategories(
                roadClosedIncidents,
                availableIncidentCategories.filter((category) => category != 'road-closed'),
            ),
        ).toHaveLength(0);

        config = {
            visible: true,
            filters: {
                any: [
                    { incidentCategories: { show: 'only', values: ['road-closed'] } },
                    { roadCategories: { show: 'only', values: ['motorway', 'trunk', 'primary'] } },
                ],
            },
        };

        // Changing filter to show road closures and major roads:
        await applyConfig(page, config);
        expect(await getConfig(page)).toEqual(config);

        // changing the map style: verifying the config is still the same (state restoration):
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);
        expect(await getConfig(page)).toEqual(config);

        const roadClosedAndMajorRoadIncidents = await waitForShownIncidentsChange(page, defaultIncidents.length);
        expect(roadClosedAndMajorRoadIncidents.length).toBeLessThan(defaultIncidents.length);
        // The addition of major road and road_closed incidents should be greater or equal than the total
        // (since there can be overlap due to the "any"/"or" filter)
        expect(
            getByRoadCategories(roadClosedAndMajorRoadIncidents, ['motorway', 'trunk', 'primary']).length +
                getByIncidentCategories(roadClosedAndMajorRoadIncidents, ['road-closed']).length,
        ).toBeGreaterThanOrEqual(roadClosedAndMajorRoadIncidents.length);

        // We reset the config and assert that we have the same amount of incidents as the beginning:
        await resetConfig(page);
        const resetIncidents = await waitForShownIncidentsChange(page, roadClosedAndMajorRoadIncidents.length);
        expect(resetIncidents).toHaveLength(0);

        await applyConfig(page, { visible: true });
        const defaultResetIncidents = await waitForShownIncidentsChange(page, roadClosedAndMajorRoadIncidents.length);
        expect(defaultResetIncidents).toHaveLength(defaultResetIncidents.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Traffic incidents filtering with complex initial config', async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 13, center: [-0.12621, 51.50394] },
            { style: { type: 'standard', include: ['trafficIncidents'] } },
        );

        const config: IncidentsConfig = {
            visible: true,
            filters: {
                any: [
                    {
                        magnitudes: { show: 'only', values: ['moderate', 'major'] },
                        delays: { minDelayMinutes: 5 },
                    },
                    { incidentCategories: { show: 'only', values: ['road-closed'] } },
                ],
            },
        };

        await initTrafficIncidents(page, config);
        expect(await getConfig(page)).toEqual(config);
        await waitForMapIdle(page);

        // INCIDENTS assertions:
        let renderedIncidents = await waitForShownIncidentsChange(page, 0);
        expect(renderedIncidents.length).toBeGreaterThan(5);

        expect(getByIncidentCategories(renderedIncidents, ['road-closed']).length).toBeGreaterThan(0);

        // We only allow for moderate, major and indefinite (because of road closures) magnitudes:
        expect(
            renderedIncidents.filter((incident) =>
                (['unknown', 'minor'] as DelayMagnitude[]).includes(incident.properties.magnitudeOfDelay),
            ),
        ).toHaveLength(0);

        // CHANGING THE MAP STYLE: verifying the config is still the same (state restoration):
        await setStyle(page, { type: 'standard', id: 'standardDark', include: ['trafficIncidents'] });
        await waitForMapIdle(page);
        expect(await getConfig(page)).toEqual(config);

        // Asserting similar things again:
        // INCIDENTS assertions:
        renderedIncidents = await waitForShownIncidentsChange(page, 0);
        expect(
            renderedIncidents.filter((incident) =>
                (['unknown', 'minor'] as DelayMagnitude[]).includes(incident.properties.magnitudeOfDelay),
            ),
        ).toHaveLength(0);
        expect(getByIncidentCategories(renderedIncidents, ['road-closed']).length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // (We'll verify that using dedicated methods for filtering and visibility do not affect each other)
    test('Traffic visibility and filtering with dedicated methods', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [-0.12621, 51.50394] }); // London

        await initTrafficIncidents(page);

        const incidentFilters: TrafficIncidentsFilters = {
            any: [{ incidentCategories: { show: 'only', values: ['road-closed'] } }],
        };
        // Showing road closures only:
        await page.evaluate(
            async (inputIncidentFilters) => (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters),
            incidentFilters,
        );
        expect(await getConfig(page)).toEqual({
            filters: incidentFilters,
            icons: {},
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));

        // (changing incidents filter directly shouldn't affect flow visibility):
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())).toBe(
            true,
        );
        await waitForMapIdle(page);
        const roadClosedIncidents = await waitForShownIncidentsChange(page, 0);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ['road-closed'])).toHaveLength(roadClosedIncidents.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await getConfig(page)).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: {},
        });

        await page.evaluate(
            async (inputIncidentFilters) =>
                (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters, inputIncidentFilters),
            incidentFilters,
        );
        expect(await getConfig(page)).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: { filters: incidentFilters },
        });

        await page.evaluate(
            async (inputIncidentFilters) => (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters),
            incidentFilters,
        );
        expect(await getConfig(page)).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: {},
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await getConfig(page)).toEqual({
            visible: true,
            filters: incidentFilters,
            icons: {},
        });
    });

    test('Incidents stay hidden when style changes immediately after resetConfig', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [-0.12621, 51.50394] });

        await initTrafficIncidents(page);
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(true);

        // Reset config and change style without waiting in between:
        await resetConfig(page);
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);

        expect(await getConfig(page)).toBeUndefined();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
