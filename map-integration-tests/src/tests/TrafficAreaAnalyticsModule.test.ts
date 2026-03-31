import { expect, test } from '@playwright/test';
import type { TrafficAreaAnalytics } from 'core';
import analyticsFixtureJson from './data/TrafficAreaAnalyticsModule.test.data.json';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    clearTrafficAreaAnalytics,
    initTrafficAreaAnalytics,
    showTrafficAreaAnalytics,
    waitForMapIdle,
} from './util/TestUtils';

const analyticsFixture = analyticsFixtureJson as unknown as TrafficAreaAnalytics;

test.describe('Traffic Area Analytics module integration tests', () => {
    const madridCenter: [number, number] = [-3.7038, 40.4168];

    test('Init module with default config — no data shown', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 12 });
        await initTrafficAreaAnalytics(page);
        await waitForMapIdle(page);

        const shown = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getShown());
        expect(shown?.heatmap.features).toHaveLength(0);
        expect(shown?.hexgrid.features).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('show() populates both heatmap and hexgrid sources from raw response', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        const shown = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getShown());
        expect(shown?.heatmap.features.length).toBeGreaterThan(0);
        expect(shown?.hexgrid.features.length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('show() with multiple features populates all region features', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        const multiRegionFixture: TrafficAreaAnalytics = {
            ...analyticsFixture,
            features: [
                analyticsFixture.features[0],
                {
                    ...analyticsFixture.features[0],
                    id: 'region-madrid-2',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-3.8, 40.39],
                                [-3.74, 40.39],
                                [-3.74, 40.45],
                                [-3.8, 40.45],
                                [-3.8, 40.39],
                            ],
                        ],
                    },
                },
            ],
        };

        await showTrafficAreaAnalytics(page, multiRegionFixture);
        await waitForMapIdle(page);

        const regionFeatureCount = await page.evaluate(() => {
            const module = (globalThis as MapsSDKThis).trafficAreaAnalytics as any;
            return module?.sourcesWithLayers?.region?.shownFeatures?.features?.length as number | undefined;
        });
        expect(regionFeatureCount).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('clear() removes all data', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await clearTrafficAreaAnalytics(page);

        const shown = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getShown());
        expect(shown?.heatmap.features).toHaveLength(0);
        expect(shown?.hexgrid.features).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setMode() switches between heatmap and hexgrid', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { displayMode: 'hexgrid-3d', metric: 'congestionLevel' });
        await showTrafficAreaAnalytics(page, analyticsFixture);

        // Switch to heatmap
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        const configAfterHeatmap = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configAfterHeatmap?.displayMode).toBe('heatmap');

        // Switch back to hexgrid
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('hexgrid-3d'));
        const configAfterHexgrid = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configAfterHexgrid?.displayMode).toBe('hexgrid-3d');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('color preset is stored in config at init', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { displayMode: 'hexgrid-3d', color: 'thermal' });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.color).toBe('thermal');
        expect(config?.displayMode).toBe('hexgrid-3d');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with preset updates color and setMode() updates displayMode', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('monochrome'));
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.color).toBe('monochrome');
        expect(config?.displayMode).toBe('heatmap');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('custom color stops at init are stored in config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        const customStops = [
            { value: 0, color: '#0000ff' },
            { value: 0.5, color: '#ffff00' },
            { value: 1, color: '#ff0000' },
        ];
        await initTrafficAreaAnalytics(page, { color: { congestionLevel: customStops } });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(typeof config?.color).toBe('object');
        expect((config?.color as Record<string, typeof customStops>)?.congestionLevel?.[0]?.color).toBe('#0000ff');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with stops updates config; undefined reverts to default preset', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { color: 'thermal' });

        const customStops = [
            { value: 0, color: '#ffffff' },
            { value: 1, color: '#000000' },
        ];

        await page.evaluate(
            (stops) => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor({ congestionLevel: stops }),
            customStops,
        );
        const configWithStops = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(typeof configWithStops?.color).toBe('object');

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor(undefined));
        const configReverted = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configReverted?.color).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('regionPolygon config at init is stored in config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, {
            regionPolygon: { color: '#ff0000', fillOpacity: 0.2, outlineOpacity: 0.9, outlineWidth: 3 },
        });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.regionPolygon?.color).toBe('#ff0000');
        expect(config?.regionPolygon?.fillOpacity).toBe(0.2);
        expect(config?.regionPolygon?.outlineOpacity).toBe(0.9);
        expect(config?.regionPolygon?.outlineWidth).toBe(3);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('beforeLayerConfig at init and moveBeforeLayer() update config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, {
            beforeLayerConfig: {
                heatmap: 'lowestLabel',
                hexgrid: { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
                square: { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
            },
        });

        const configAtInit = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configAtInit?.beforeLayerConfig?.heatmap).toBe('lowestLabel');
        expect(configAtInit?.beforeLayerConfig?.hexgrid?.extrusion3D).toBe('lowestPlaceLabel');

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.moveBeforeLayer({
                heatmap: 'top',
                hexgrid: { flat2D: 'top', extrusion3D: 'top' },
                square: { flat2D: 'top', extrusion3D: 'top' },
            }),
        );
        const configAfterMove = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configAfterMove?.beforeLayerConfig?.heatmap).toBe('top');
        expect(configAfterMove?.beforeLayerConfig?.hexgrid?.flat2D).toBe('top');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setMetric() updates the active metric in config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMetric('speed'));
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.metric).toBe('speed');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setVisible(false) hides all layers', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setVisible(false));
        const isVisible = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.isVisible());
        expect(isVisible).toBe(false);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setVisible(true));
        await waitForMapIdle(page);
        const isVisibleAfter = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.isVisible());
        expect(isVisibleAfter).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
