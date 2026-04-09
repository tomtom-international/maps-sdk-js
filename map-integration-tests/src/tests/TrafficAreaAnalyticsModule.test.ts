import { expect, test } from '@playwright/test';
import type { TrafficAreaAnalytics } from 'core';
import type { AreaAnalyticsColorStopsConfig } from 'map';
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
        expect(shown?.square.features).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('show() populates heatmap, hexgrid, and square sources from raw response', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        const shown = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getShown());
        expect(shown?.heatmap.features.length).toBeGreaterThan(0);
        expect(shown?.hexgrid.features.length).toBeGreaterThan(0);
        expect(shown?.square.features.length).toBeGreaterThan(0);

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
        expect(shown?.square.features).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setMode() switches between heatmap and hexgrid', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { displayMode: 'hexgrid-3d', activeMetric: 'congestionLevel' });
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

    test('setMode() switches to hexgrid-2d, square-2d and square-3d modes', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('hexgrid-2d'));
        const configHexgrid2d = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configHexgrid2d?.displayMode).toBe('hexgrid-2d');

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('square-3d'));
        const configSquare3d = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configSquare3d?.displayMode).toBe('square-3d');

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('square-2d'));
        const configSquare2d = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configSquare2d?.displayMode).toBe('square-2d');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('color preset is stored in metricConfig at init', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, {
            displayMode: 'hexgrid-3d',
            metricConfig: { congestionLevel: { color: 'heat' } },
        });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.metricConfig?.congestionLevel?.color).toBe('heat');
        expect(config?.displayMode).toBe('hexgrid-3d');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with preset expands to stops object in metricConfig and setMode() updates displayMode', async ({
        page,
    }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('monochrome'));
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(typeof config?.metricConfig?.congestionLevel?.color).toBe('object');
        expect(config?.displayMode).toBe('heatmap');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('custom color stops at init are stored in metricConfig', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        const customStops = [
            { value: 0, color: '#0000ff' },
            { value: 0.5, color: '#ffff00' },
            { value: 1, color: '#ff0000' },
        ];
        await initTrafficAreaAnalytics(page, {
            metricConfig: { congestionLevel: { color: { valueType: 'raw', stops: customStops } } },
        });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(typeof config?.metricConfig?.congestionLevel?.color).toBe('object');
        expect(
            ((config?.metricConfig?.congestionLevel?.color as AreaAnalyticsColorStopsConfig)?.stops?.[0] as any)?.color,
        ).toBe('#0000ff');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with stops updates metricConfig; undefined clears color', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { metricConfig: { congestionLevel: { color: 'heat' } } });

        const customStops = [
            { value: 0, color: '#ffffff' },
            { value: 100, color: '#000000' },
        ];

        await page.evaluate(
            (stops) => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor({ valueType: 'raw', stops } as any),
            customStops,
        );
        const configWithStops = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(typeof configWithStops?.metricConfig?.congestionLevel?.color).toBe('object');

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor(undefined));
        const configReverted = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configReverted?.metricConfig?.congestionLevel?.color).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setHeight() updates height config for active metric', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setHeight({ maxHeightMeters: 500, minHeightMeters: 10 }),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect((config?.metricConfig?.congestionLevel?.height as any)?.maxHeightMeters).toBe(500);
        expect((config?.metricConfig?.congestionLevel?.height as any)?.minHeightMeters).toBe(10);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('filter() and clearFilter() update metric filters config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.filter({ min: 20, max: 80 }));
        const configFiltered = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configFiltered?.metricConfig?.congestionLevel?.filters?.min).toBe(20);
        expect(configFiltered?.metricConfig?.congestionLevel?.filters?.max).toBe(80);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.clearFilter());
        const configCleared = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configCleared?.metricConfig?.congestionLevel?.filters).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('regionPolygon config at init is stored in config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, {
            regionPolygon: { color: '#ff0000', fillOpacity: 0.2, outlineOpacity: 0.9, outlineWidth: 3, inverted: true },
        });

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config?.regionPolygon?.color).toBe('#ff0000');
        expect(config?.regionPolygon?.fillOpacity).toBe(0.2);
        expect(config?.regionPolygon?.outlineOpacity).toBe(0.9);
        expect(config?.regionPolygon?.outlineWidth).toBe(3);
        expect(config?.regionPolygon?.inverted).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('regionPolygon inverted produces donut geometry over region data', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { regionPolygon: { inverted: true, fillOpacity: 0.5 } });
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        // The region source should have a polygon with more than one ring (donut = world ring + hole)
        const ringCount = await page.evaluate(() => {
            const module = (globalThis as MapsSDKThis).trafficAreaAnalytics as any;
            const features = module?.sourcesWithLayers?.region?.shownFeatures?.features;
            return features?.[0]?.geometry?.coordinates?.length as number | undefined;
        });
        expect(ringCount).toBeGreaterThan(1);

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
        expect(config?.activeMetric).toBe('speed');

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

    test('events.on() configChange listener fires on setMode, setMetric, and setColor', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => {
            (globalThis as any)._configChangeCount = 0;
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.events.on('config-change', () => {
                (globalThis as any)._configChangeCount++;
            });
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMetric('speed'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));

        const changeCount = await page.evaluate(() => (globalThis as any)._configChangeCount as number);
        expect(changeCount).toBe(3);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('events.on() configChange unsubscribe stops future notifications', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => {
            (globalThis as any)._configChangeCount = 0;
            (globalThis as any)._unsubscribeConfigChange = (globalThis as MapsSDKThis).trafficAreaAnalytics?.events.on(
                'config-change',
                () => {
                    (globalThis as any)._configChangeCount++;
                },
            );
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        await page.evaluate(() => (globalThis as any)._unsubscribeConfigChange?.());
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMetric('speed'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));

        const changeCount = await page.evaluate(() => (globalThis as any)._configChangeCount as number);
        expect(changeCount).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with preset theme expands to all metrics', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        // All metrics should now have a concrete color stops object (not a string preset)
        expect(typeof config?.metricConfig?.congestionLevel?.color).toBe('object');
        expect(typeof config?.metricConfig?.speed?.color).toBe('object');
        expect(typeof config?.metricConfig?.travelTime?.color).toBe('object');
        expect(typeof config?.metricConfig?.freeFlowSpeed?.color).toBe('object');
        expect(typeof config?.metricConfig?.networkLength?.color).toBe('object');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor(undefined) reverts all metrics to default config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor(undefined));

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        // After reset, colors should be cleared (no theme overrides)
        expect(config?.metricConfig?.congestionLevel?.color).toBeUndefined();
        expect(config?.metricConfig?.speed?.color).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with theme applied to speed/freeFlowSpeed metrics produces no interpolate errors', async ({
        page,
    }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { activeMetric: 'speed' });
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));
        await waitForMapIdle(page);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMetric('freeFlowSpeed'));
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('viridis'));
        await waitForMapIdle(page);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setHeight() with scaleMode raw and scaleFactor stores config for targeted metric', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { activeMetric: 'speed' });

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setHeight({ scaleMode: 'raw', scaleFactor: 2.5 }, [
                'speed',
            ]),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect((config?.metricConfig?.speed?.height as any)?.scaleMode).toBe('raw');
        expect((config?.metricConfig?.speed?.height as any)?.scaleFactor).toBe(2.5);
        // Other metrics should not be affected
        expect((config?.metricConfig?.congestionLevel?.height as any)?.scaleMode).not.toBe('raw');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setHeight() with scaleMode currentRange stores config for active metric', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setHeight({
                scaleMode: 'currentRange',
                maxHeightMeters: 300,
            }),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect((config?.metricConfig?.congestionLevel?.height as any)?.scaleMode).toBe('currentRange');
        expect((config?.metricConfig?.congestionLevel?.height as any)?.maxHeightMeters).toBe(300);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('filter() with metrics array only affects the specified metrics', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { activeMetric: 'congestionLevel' });
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.filter({ min: 10, max: 90 }, ['congestionLevel']),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.metricConfig?.congestionLevel?.filters?.min).toBe(10);
        expect(config?.metricConfig?.congestionLevel?.filters?.max).toBe(90);
        // speed metric should not be affected
        expect(config?.metricConfig?.speed?.filters).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setMetric() preserves per-metric config isolation', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { activeMetric: 'congestionLevel' });

        // Configure congestionLevel only (use metrics array to target a single metric)
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.filter({ min: 5, max: 95 }, ['congestionLevel']),
        );
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setHeight({ maxHeightMeters: 200 }, ['congestionLevel']),
        );

        // Switch to speed — congestionLevel config should be preserved
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMetric('speed'));
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.activeMetric).toBe('speed');
        expect(config?.metricConfig?.congestionLevel?.filters?.min).toBe(5);
        expect((config?.metricConfig?.congestionLevel?.height as any)?.maxHeightMeters).toBe(200);
        expect(config?.metricConfig?.speed?.filters).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setColor() with metrics array only updates specified metrics', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        // Apply heat to all metrics, then clear only speed and freeFlowSpeed
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor(undefined, ['speed', 'freeFlowSpeed']),
        );

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        // Targeted metrics should be cleared
        expect(config?.metricConfig?.speed?.color).toBeUndefined();
        expect(config?.metricConfig?.freeFlowSpeed?.color).toBeUndefined();
        // Non-targeted metrics should retain their color from the heat theme
        expect(typeof config?.metricConfig?.congestionLevel?.color).toBe('object');
        expect(typeof config?.metricConfig?.travelTime?.color).toBe('object');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('setHeight() with metrics array only updates specified metrics', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.setHeight({ scaleMode: 'currentRange' }, [
                'speed',
                'freeFlowSpeed',
            ]),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect((config?.metricConfig?.speed?.height as any)?.scaleMode).toBe('currentRange');
        expect((config?.metricConfig?.freeFlowSpeed?.height as any)?.scaleMode).toBe('currentRange');
        // Other metrics should not be affected
        expect((config?.metricConfig?.congestionLevel?.height as any)?.scaleMode).not.toBe('currentRange');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('filter() with metrics array and clearFilter() with metrics array', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        // Apply filter to all metrics
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.filter({ min: 10 }));
        const configFiltered = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(configFiltered?.metricConfig?.congestionLevel?.filters?.min).toBe(10);
        expect(configFiltered?.metricConfig?.speed?.filters?.min).toBe(10);

        // Clear filter only for speed
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.clearFilter(['speed']));
        const configPartialClear = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configPartialClear?.metricConfig?.speed?.filters).toBeUndefined();
        expect(configPartialClear?.metricConfig?.congestionLevel?.filters?.min).toBe(10);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyConfig() with mixed options applies all fields in one call', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({
                displayMode: 'heatmap',
                activeMetric: 'speed',
                metricConfig: {
                    speed: { color: 'heat' },
                    congestionLevel: { filters: { min: 10 } },
                },
            }),
        );
        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.displayMode).toBe('heatmap');
        expect(config?.activeMetric).toBe('speed');
        expect(config?.metricConfig?.speed?.color).toBe('heat');
        expect(config?.metricConfig?.congestionLevel?.filters?.min).toBe(10);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyConfig() merges metricConfig at metric-key level without wiping other metrics', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        // Establish a baseline: give speed and congestionLevel distinct colors
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({
                metricConfig: {
                    speed: { color: 'heat' },
                    congestionLevel: { color: 'viridis' },
                },
            }),
        );

        // Now apply config touching only travelTime — other metrics must be preserved
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({
                metricConfig: { travelTime: { color: 'plasma' } },
            }),
        );

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.metricConfig?.speed?.color).toBe('heat');
        expect(config?.metricConfig?.congestionLevel?.color).toBe('viridis');
        expect(config?.metricConfig?.travelTime?.color).toBe('plasma');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyConfig() preserves setter-applied config for properties not in the new call', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        // Apply color via setter
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setColor('heat'));

        // applyConfig touches only displayMode — color state from setColor must survive
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({ displayMode: 'heatmap' }),
        );

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.displayMode).toBe('heatmap');
        // heat theme was expanded to stops objects by setColor — those should still be present
        expect(typeof config?.metricConfig?.congestionLevel?.color).toBe('object');
        expect(typeof config?.metricConfig?.speed?.color).toBe('object');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyConfig() with regionPolygon and visible false stores those fields', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig({
                visible: false,
                regionPolygon: { color: '#ff0000', fillOpacity: 0.3, outlineWidth: 4 },
            }),
        );

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());

        expect(config?.visible).toBe(false);
        expect(config?.regionPolygon?.color).toBe('#ff0000');
        expect(config?.regionPolygon?.fillOpacity).toBe(0.3);
        expect(config?.regionPolygon?.outlineWidth).toBe(4);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyConfig(undefined) resets config to undefined', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page, { displayMode: 'heatmap', activeMetric: 'speed' });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.applyConfig(undefined));

        const config = await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig());
        expect(config).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('events.on() hover handler works alongside configChange handler', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: madridCenter, zoom: 13 });
        await initTrafficAreaAnalytics(page);

        // Both handlers can be registered without error
        await page.evaluate(() => {
            (globalThis as any)._configChangeCount = 0;
            const eventsModule = (globalThis as MapsSDKThis).trafficAreaAnalytics?.events;
            eventsModule?.on('config-change', () => {
                (globalThis as any)._configChangeCount++;
            });
            eventsModule?.on('hover', () => {
                // hover handler registered — just needs to not throw
            });
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('hexgrid-2d'));
        const changeCount = await page.evaluate(() => (globalThis as any)._configChangeCount as number);
        expect(changeCount).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
