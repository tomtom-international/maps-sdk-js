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
        await initTrafficAreaAnalytics(page, { mode: 'hexgrid', metric: 'congestionLevel' });
        await showTrafficAreaAnalytics(page, analyticsFixture);
        await waitForMapIdle(page);

        // Switch to heatmap
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('heatmap'));
        const configAfterHeatmap = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configAfterHeatmap?.mode).toBe('heatmap');

        // Switch back to hexgrid
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.setMode('hexgrid'));
        const configAfterHexgrid = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.getConfig(),
        );
        expect(configAfterHexgrid?.mode).toBe('hexgrid');

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
        const isVisibleAfter = await page.evaluate(() =>
            (globalThis as MapsSDKThis).trafficAreaAnalytics?.isVisible(),
        );
        expect(isVisibleAfter).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
