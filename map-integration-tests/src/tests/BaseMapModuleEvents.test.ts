import { expect, test } from '@playwright/test';
import type { Point } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { getClickedTopFeature, getPixelCoords, initBasemap, initBasemap2, waitForMapIdle } from './util/TestUtils';

test.describe('Tests with user events related to Base Map', () => {
    const mapEnv = new MapTestEnv();

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

    test('Events from two Base Map modules with mutually exclusive layer groups', async ({ page }) => {
        await initBasemap(page, { layerGroupsFilter: { mode: 'include', names: ['cityLabels'] } });
        await initBasemap2(page, { layerGroupsFilter: { mode: 'exclude', names: ['cityLabels'] } });
        await waitForMapIdle(page);

        const baseMapCityFeature = await getPixelCoords(
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

        // only first base map listens to click events for now:
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.baseMap?.events.on('click', (topFeature) => {
                mapsSDKThis._numOfClicks++;
                mapsSDKThis._clickedTopFeature = topFeature;
            });
        });

        // we click on the base map place (city label) and verify that the callback is called correctly:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(1);
        expect((await getClickedTopFeature(page))?.layer.id).toBe('Places - City');

        // now we register a click handler for the second base map:
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.baseMap2?.events.on('click', (topFeature) => {
                (mapsSDKThis as any)._numOfClicks2++;
                (mapsSDKThis as any)._clickedTopFeature2 = topFeature;
            });
        });
        await page.evaluate(() => ((globalThis as any)._numOfClicks2 = 0));

        // We click on the city label again. Even if the other base map module also listens to clicks, its layers are below
        // so the first base map is the only one to fire the event:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(0);
        expect((await getClickedTopFeature(page))?.layer.id).toBe('Places - City');
        expect(await page.evaluate(() => (globalThis as any)._clickedTopFeature2)).toBeUndefined();

        // now we click on an "empty" (non-city) area of the map, and verify that this time the second base map module fires the event:
        await page.mouse.click(baseMapCityFeature.x + 50, baseMapCityFeature.y + 50);
        // no changes in first base map:
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        // base map 2 fired the event:
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(1);
        expect(
            await page.evaluate(() => ((globalThis as any)._clickedTopFeature2 as MapGeoJSONFeature)?.layer.id),
        ).not.toBe('Places - City');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
