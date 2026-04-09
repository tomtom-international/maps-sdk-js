import { expect, test } from '@playwright/test';
import type { Places, PolygonFeatures, Routes } from 'core';
import geometryData from './data/GeometriesModule.test.data.json';
import placesData from './data/PlacesModuleEvents.test.data.json';
import routesData from './data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json';
import trafficAreaAnalyticsData from './data/TrafficAreaAnalyticsModule.test.data.json';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    initBasemap,
    initGeometries,
    initHillshade,
    initPlaces,
    initPOIs,
    initRouting,
    initTrafficAreaAnalytics,
    initTrafficFlow,
    initTrafficIncidents,
    showGeometry,
    showPlaces,
    showTrafficAreaAnalytics,
    waitForMapIdle,
} from './util/TestUtils';

const places = placesData as unknown as Places;
const geometry = geometryData as unknown as PolygonFeatures;
const routes = routesData as unknown as Routes;

// Helper: register a config-change handler and store result in globalThis
const setupConfigChangeHandler = (moduleName: keyof MapsSDKThis) =>
    `
    (function() {
        const mapsSdkThis = globalThis;
        mapsSdkThis._configChangeResult = undefined;
        mapsSdkThis._configChangeCount = 0;
        mapsSdkThis._configChangeUnsub = mapsSdkThis.${String(moduleName)}?.events.on('config-change', (config) => {
            mapsSdkThis._configChangeResult = config;
            mapsSdkThis._configChangeCount = (mapsSdkThis._configChangeCount || 0) + 1;
        });
    })();
    `;

test.describe('ModuleEvents — config-change events', () => {
    const mapEnv = new MapTestEnv();

    test('TrafficFlowModule fires config-change when setVisible is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficFlow(page, { visible: false });

        await page.evaluate(setupConfigChangeHandler('trafficFlow'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config.visible).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('TrafficIncidentsModule fires config-change when setVisible is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficIncidents(page, { visible: true });

        await page.evaluate(setupConfigChangeHandler('trafficIncidents'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config.visible).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('POIsModule fires config-change when filterCategories is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await initPOIs(page);

        await page.evaluate(setupConfigChangeHandler('pois'));
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: 'only',
                values: ['RESTAURANT' as any],
            }),
        );

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config.filters?.categories?.show).toBe('only');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('PlacesModule fires config-change when applyTheme is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [4.90047, 52.37708] });
        await initPlaces(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);

        await page.evaluate(setupConfigChangeHandler('places'));
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.applyTheme('circle'));

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('GeometriesModule fires config-change when moveBeforeLayer is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 10, center: [4.9, 52.37] });
        await initGeometries(page);

        await page.evaluate(setupConfigChangeHandler('geometries'));
        await page.evaluate(() => (globalThis as MapsSDKThis).geometries?.moveBeforeLayer('top'));

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config?.beforeLayerConfig).toBe('top');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('config-change: two handlers, unsubscribing one leaves the other active', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficFlow(page, { visible: false });

        await page.evaluate(() => {
            (globalThis as any)._configChangeCountA = 0;
            (globalThis as any)._configChangeCountB = 0;
            (globalThis as any)._configChangeUnsubA = (globalThis as MapsSDKThis).trafficFlow?.events.on(
                'config-change',
                () => {
                    (globalThis as any)._configChangeCountA++;
                },
            );
            (globalThis as MapsSDKThis).trafficFlow?.events.on('config-change', () => {
                (globalThis as any)._configChangeCountB++;
            });
        });

        // Both fire on first change
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.waitForFunction(() => (globalThis as any)._configChangeCountB > 0, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._configChangeCountA)).toBe(1);
        expect(await page.evaluate(() => (globalThis as any)._configChangeCountB)).toBe(1);

        // Unsubscribe only handlerA
        await page.evaluate(() => (globalThis as any)._configChangeUnsubA?.());

        // Second change — only handlerB fires
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        await page.waitForFunction(() => (globalThis as any)._configChangeCountB > 1, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._configChangeCountA)).toBe(1);
        expect(await page.evaluate(() => (globalThis as any)._configChangeCountB)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('config-change off() stops all handlers', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficFlow(page, { visible: false });

        await page.evaluate(() => {
            (globalThis as any)._configChangeCount = 0;
            (globalThis as MapsSDKThis).trafficFlow?.events.on('config-change', () => {
                (globalThis as any)._configChangeCount++;
            });
            (globalThis as MapsSDKThis).trafficFlow?.events.on('config-change', () => {
                (globalThis as any)._configChangeCount++;
            });
        });

        // Both handlers fire — count reaches 2
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.waitForFunction(() => (globalThis as any)._configChangeCount >= 2, undefined, { timeout: 5000 });

        // off() clears all handlers
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.events.off('config-change'));

        // Further changes should not fire
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        await page.waitForFunction(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible() === false, undefined, {
            timeout: 5000,
        });
        expect(await page.evaluate(() => (globalThis as any)._configChangeCount)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('config-change unsubscribe stops receiving events', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficFlow(page, { visible: false });

        await page.evaluate(setupConfigChangeHandler('trafficFlow'));

        // First call — should fire
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._configChangeCount)).toBe(1);

        // Unsubscribe
        await page.evaluate(() => (globalThis as any)._configChangeUnsub?.());

        // Second call — should NOT fire again
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        await page.waitForFunction(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible() === false, undefined, {
            timeout: 5000,
        });
        expect(await page.evaluate(() => (globalThis as any)._configChangeCount)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('BaseMapModule fires config-change when setLayerGroupVisible is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initBasemap(page);

        await page.evaluate(setupConfigChangeHandler('baseMap'));
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).baseMap?.setVisible(false, {
                layerGroups: { mode: 'include', names: ['roadLines'] },
            }),
        );

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('HillshadeModule fires config-change when setVisible is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 10, center: [10.0, 47.0] });
        await initHillshade(page, { visible: false });

        await page.evaluate(setupConfigChangeHandler('hillshade'));
        await page.evaluate(() => (globalThis as MapsSDKThis).hillshade?.setVisible(true));

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config?.visible).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('RoutingModule fires config-change when applyConfig is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 9, center: [4.4777, 51.9244] });
        await initRouting(page);

        await page.evaluate(() => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis._configChangeResult = undefined;
            mapsSdkThis._configChangeCount = 0;
            mapsSdkThis._configChangeUnsub = mapsSdkThis.routing?.events.module.on('config-change', (config) => {
                mapsSdkThis._configChangeResult = config;
                mapsSdkThis._configChangeCount = ((mapsSdkThis as any)._configChangeCount || 0) + 1;
            });
        });
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).routing?.applyConfig({ summaryBubbles: { visible: false } }),
        );

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config?.summaryBubbles?.visible).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('TrafficAreaAnalyticsModule fires config-change when applyConfig is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(setupConfigChangeHandler('trafficAreaAnalytics'));
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({ displayMode: 'hexgrid-2d' }),
        );

        await page.waitForFunction(() => (globalThis as any)._configChangeCount > 0, undefined, { timeout: 5000 });
        const config = await page.evaluate(() => (globalThis as any)._configChangeResult);
        expect(config?.displayMode).toBe('hexgrid-2d');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('ModuleEvents — shown-features events', () => {
    const mapEnv = new MapTestEnv();

    test('PlacesModule fires shown-features when show is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [4.90047, 52.37708] });
        await initPlaces(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesResult = undefined;
            (globalThis as MapsSDKThis).places?.events.on('shown-features', (features) => {
                (globalThis as any)._shownFeaturesResult = features;
            });
        });

        await showPlaces(page, places);

        await page.waitForFunction(() => (globalThis as any)._shownFeaturesResult !== undefined, undefined, {
            timeout: 5000,
        });
        const shownFeatures = await page.evaluate(() => (globalThis as any)._shownFeaturesResult);
        expect(shownFeatures).toBeDefined();
        expect(shownFeatures.type).toBe('FeatureCollection');
        expect(shownFeatures.features.length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('GeometriesModule fires shown-features when show is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 10, center: [4.9, 52.37] });
        await initGeometries(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesResult = undefined;
            (globalThis as MapsSDKThis).geometries?.events.on('shown-features', (features) => {
                (globalThis as any)._shownFeaturesResult = features;
            });
        });

        await showGeometry(page, geometry);

        await page.waitForFunction(() => (globalThis as any)._shownFeaturesResult !== undefined, undefined, {
            timeout: 5000,
        });
        const shownFeatures = await page.evaluate(() => (globalThis as any)._shownFeaturesResult);
        expect(shownFeatures).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('RoutingModule fires shown-features with routes when showRoutes is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 9, center: [4.4777, 51.9244] });

        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.routing = await mapsSdkThis.MapsSDK.RoutingModule.get(mapsSdkThis.tomtomMap);
        });

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesResult = undefined;
            (globalThis as MapsSDKThis).routing?.events.module.on('shown-features', (features) => {
                (globalThis as any)._shownFeaturesResult = features;
            });
        });

        await page.evaluate((inputRoutes: Routes) => {
            (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes);
        }, routes);

        await page.waitForFunction(() => (globalThis as any)._shownFeaturesResult !== undefined, undefined, {
            timeout: 5000,
        });
        const shownFeatures = await page.evaluate(() => (globalThis as any)._shownFeaturesResult);
        expect(shownFeatures).toBeDefined();
        expect('routes' in shownFeatures).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('shown-features unsubscribe stops receiving events', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [4.90047, 52.37708] });
        await initPlaces(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesCount = 0;
            const unsub = (globalThis as MapsSDKThis).places?.events.on('shown-features', () => {
                (globalThis as any)._shownFeaturesCount++;
            });
            (globalThis as any)._shownFeaturesUnsub = unsub;
        });

        // First show — should fire
        await showPlaces(page, places);
        await page.waitForFunction(() => (globalThis as any)._shownFeaturesCount > 0, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCount)).toBe(1);

        // Unsubscribe
        await page.evaluate(() => (globalThis as any)._shownFeaturesUnsub?.());

        // Second show — should NOT fire again
        await showPlaces(page, places);
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCount)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('shown-features: two handlers, unsubscribing one leaves the other active', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [4.90047, 52.37708] });
        await initPlaces(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesCountA = 0;
            (globalThis as any)._shownFeaturesCountB = 0;
            (globalThis as any)._shownFeaturesUnsubA = (globalThis as MapsSDKThis).places?.events.on(
                'shown-features',
                () => {
                    (globalThis as any)._shownFeaturesCountA++;
                },
            );
            (globalThis as MapsSDKThis).places?.events.on('shown-features', () => {
                (globalThis as any)._shownFeaturesCountB++;
            });
        });

        // Both fire on first show
        await showPlaces(page, places);
        await page.waitForFunction(() => (globalThis as any)._shownFeaturesCountB > 0, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCountA)).toBe(1);
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCountB)).toBe(1);

        // Unsubscribe only handlerA
        await page.evaluate(() => (globalThis as any)._shownFeaturesUnsubA?.());

        // Second show — only handlerB fires
        await showPlaces(page, places);
        await page.waitForFunction(() => (globalThis as any)._shownFeaturesCountB > 1, undefined, { timeout: 5000 });
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCountA)).toBe(1);
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCountB)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('shown-features off() stops all handlers', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [4.90047, 52.37708] });
        await initPlaces(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesCount = 0;
            (globalThis as MapsSDKThis).places?.events.on('shown-features', () => {
                (globalThis as any)._shownFeaturesCount++;
            });
            (globalThis as MapsSDKThis).places?.events.on('shown-features', () => {
                (globalThis as any)._shownFeaturesCount++;
            });
        });

        // Both handlers fire — count reaches 2
        await showPlaces(page, places);
        await page.waitForFunction(() => (globalThis as any)._shownFeaturesCount >= 2, undefined, { timeout: 5000 });

        // off() clears all handlers
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.events.off('shown-features'));

        // Further shows should not fire
        await showPlaces(page, places);
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as any)._shownFeaturesCount)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('TrafficAreaAnalyticsModule fires shown-features when show is called', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 12, center: [4.9, 52.37] });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => {
            (globalThis as any)._shownFeaturesResult = undefined;
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.events.on('shown-features', (features) => {
                (globalThis as any)._shownFeaturesResult = features;
            });
        });

        await showTrafficAreaAnalytics(page, trafficAreaAnalyticsData);

        await page.waitForFunction(() => (globalThis as any)._shownFeaturesResult !== undefined, undefined, {
            timeout: 5000,
        });
        const shownFeatures = await page.evaluate(() => (globalThis as any)._shownFeaturesResult);
        expect(shownFeatures).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
