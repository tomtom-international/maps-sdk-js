import { expect, test } from '@playwright/test';
import type { Point } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getClickedTopFeature,
    getCursor,
    getPixelCoords,
    initBasemap,
    initBasemapScope,
    waitForMapIdle,
    waitForTimeout,
} from './util/TestUtils';

test.describe('Tests with user events related to Base Map', () => {
    const mapEnv = new MapTestEnv();

    /**
     * Helper function to get pixel coordinates of the first city label feature
     */
    const getCityFeaturePixelCoords = async (page: any) => {
        return getPixelCoords(
            page,
            await page.evaluate(
                () =>
                    (
                        (globalThis as MapsSDKThis).mapLibreMap.queryRenderedFeatures({
                            layers: ['Places - City'],
                        })?.[0].geometry as Point
                    ).coordinates,
            ),
        );
    };

    // Reset test variables for each test
    test.beforeEach(async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.34313] }, // Amsterdam center
            {
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                events: { longHoverDelayAfterMapMoveMS: 3500, longHoverDelayOnStillMapMS: 3000 },
            },
        );
    });

    // Two scopes over one base map module, covering complementary layer groups. See LSI-159.
    test('Events from two mutually exclusive layer-group scopes', async ({ page }) => {
        await initBasemap(page);
        await initBasemapScope(page, 'baseMapScope', { mode: 'include', names: ['cityLabels'] });
        await initBasemapScope(page, 'baseMapScope2', { mode: 'exclude', names: ['cityLabels'] });
        await waitForMapIdle(page);

        const baseMapCityFeature = await getCityFeaturePixelCoords(page);

        // only the city-label scope listens to click events for now:
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.baseMapScope?.on('click', (topFeature) => {
                mapsSdkThis._numOfClicks++;
                mapsSdkThis._clickedTopFeature = topFeature;
            });
        });

        // we click on the base map place (city label) and verify that the callback is called correctly:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(1);
        expect((await getClickedTopFeature(page))?.layer.id).toBe('Places - City');

        // now we register a click handler for the complementary scope:
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.baseMapScope2?.on('click', (topFeature) => {
                (mapsSdkThis as any)._numOfClicks2++;
                (mapsSdkThis as any)._clickedTopFeature2 = topFeature;
            });
        });
        await page.evaluate(() => ((globalThis as any)._numOfClicks2 = 0));

        // We click on the city label again. Even if the other scope also listens to clicks, its layers are below
        // so the city-label scope is the only one to fire the event:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(0);
        expect((await getClickedTopFeature(page))?.layer.id).toBe('Places - City');
        expect(await page.evaluate(() => (globalThis as any)._clickedTopFeature2)).toBeUndefined();

        // now we click on an "empty" (non-city) area of the map, and verify that this time the second scope fires the event:
        await page.mouse.click(baseMapCityFeature.x + 50, baseMapCityFeature.y + 50);
        // no changes in the city-label scope:
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        // the complementary scope fired the event:
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(1);
        expect(
            await page.evaluate(() => ((globalThis as any)._clickedTopFeature2 as MapGeoJSONFeature)?.layer.id),
        ).not.toBe('Places - City');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // Per-scope event config is what makes one module enough: each scope carries its own cursor.
    test('Two exclusive layer-group scopes with different cursor on hover', async ({ page }) => {
        await initBasemap(page);
        // city labels, with a 'grabbing' cursor on hover
        await initBasemapScope(
            page,
            'baseMapScope',
            { mode: 'include', names: ['cityLabels'] },
            { cursorOnHover: 'grabbing' },
        );
        // everything else, with a 'cell' cursor on hover
        await initBasemapScope(
            page,
            'baseMapScope2',
            { mode: 'exclude', names: ['cityLabels'] },
            { cursorOnHover: 'cell' },
        );
        await waitForMapIdle(page);

        // Get pixel coordinates of a city label feature
        const baseMapCityFeature = await getCityFeaturePixelCoords(page);

        // Register hover listeners for both scopes
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.baseMapScope?.on('hover', (topFeature) => {});
            mapsSdkThis.baseMapScope2?.on('hover', (topFeature) => {});
        });

        // Hover over the city label (belongs to the first scope, with the 'grabbing' cursor)
        await page.mouse.move(baseMapCityFeature.x, baseMapCityFeature.y);
        await waitForTimeout(500); // Wait for hover delay

        // Verify cursor is 'grabbing' when hovering over the city label
        expect(await getCursor(page)).toBe('grabbing');

        // Move to an area without city labels (should trigger the second scope's hover)
        await page.mouse.move(baseMapCityFeature.x + 50, baseMapCityFeature.y + 50);
        await waitForTimeout(500); // Wait for hover delay

        // Verify cursor is 'cell' when hovering over the second scope's layers
        expect(await getCursor(page)).toBe('cell');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
