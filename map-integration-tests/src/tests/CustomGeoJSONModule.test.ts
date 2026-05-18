import { expect, test } from '@playwright/test';
import type { FeatureCollection, Point } from 'geojson';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumLeftAndRightClicks,
    getNumVisibleLayersBySource,
    getPixelCoords,
    setStyle,
    waitForEventState,
    waitForMapIdle,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

// Amsterdam-area sample data.
const pointsData: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [4.89067, 52.37313] }, properties: {} },
        { type: 'Feature', id: 'b', geometry: { type: 'Point', coordinates: [4.9, 52.38] }, properties: {} },
    ],
};

const initCustomGeoJSON = async (page: import('@playwright/test').Page) =>
    page.evaluate(async () => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.customGeoJSON = await mapsSdkThis.MapsSDK.CustomGeoJSONModule.get(mapsSdkThis.tomtomMap, {
            sources: {
                points: {
                    layers: [
                        {
                            type: 'circle',
                            paint: { 'circle-radius': 8, 'circle-color': '#0a3653' },
                        },
                    ],
                },
            },
        });
    });

const showCustomPoints = async (page: import('@playwright/test').Page, data: FeatureCollection<Point>) =>
    page.evaluate((input) => (globalThis as MapsSDKThis).customGeoJSON?.show(input, 'points'), data);

// Installed on globalThis so callers can build ImageData in the page context — it can't cross the worker boundary.
const installMakeIcon = async (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
        (globalThis as MapsSDKThis).makeIcon = (color: string): ImageData => {
            const canvas = document.createElement('canvas');
            canvas.width = 24;
            canvas.height = 24;
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 24, 24);
            return ctx.getImageData(0, 0, 24, 24);
        };
    });

const getPointsIDs = async (page: import('@playwright/test').Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).customGeoJSON?.sourceAndLayerIDs.points);

test.describe('CustomGeoJSONModule integration tests', () => {
    test('init, show, style swap restore, and click event', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            zoom: 12,
            center: [4.89067, 52.37313],
        });

        await initCustomGeoJSON(page);
        const ids = await getPointsIDs(page);
        const sourceID = ids?.sourceID as string;
        const layerIDs = ids?.layerIDs as string[];

        expect(sourceID).toMatch(/^custom-geojson-\d+-points$/);
        expect(layerIDs).toHaveLength(1);
        expect(await getNumVisibleLayersBySource(page, sourceID)).toBe(0);

        await showCustomPoints(page, pointsData);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, sourceID)).toBe(1);
        await waitUntilRenderedFeatures(page, layerIDs, 2, 5000);

        // Style swap — module should restore source + layers + data.
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        const idsAfter = await getPointsIDs(page);
        expect(idsAfter?.sourceID).toBe(sourceID);
        expect(idsAfter?.layerIDs).toEqual(layerIDs);
        expect(await getNumVisibleLayersBySource(page, sourceID)).toBe(1);
        await waitUntilRenderedFeatures(page, layerIDs, 2, 5000);

        // Click event lands on the underlying source.
        await page.evaluate(() => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.customGeoJSON?.events.points.on('click', () => {
                mapsSdkThis._numOfClicks++;
            });
        });
        const pointPixelCoords = await getPixelCoords(page, [4.89067, 52.37313]);
        await page.mouse.click(pointPixelCoords.x, pointPixelCoords.y);
        await waitForEventState(page, 'click', layerIDs, 'a');
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 0]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('custom images: registered on init, restored after style swap, added via applyConfig', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            zoom: 14,
            center: [4.89067, 52.37313],
        });

        // Symbol layer references an icon registered via config.images.
        await installMakeIcon(page);
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.customGeoJSON = await mapsSdkThis.MapsSDK.CustomGeoJSONModule.get(mapsSdkThis.tomtomMap, {
                sources: {
                    points: {
                        layers: [
                            {
                                type: 'symbol',
                                layout: { 'icon-image': 'tt-blue', 'icon-allow-overlap': true },
                            },
                        ],
                    },
                },
                images: { 'tt-blue': { image: mapsSdkThis.makeIcon('#0a3653'), options: { pixelRatio: 2 } } },
            });
        });

        // Image is registered up-front, before any show().
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.hasImage('tt-blue'))).toBe(true);

        await showCustomPoints(page, pointsData);
        await waitForMapIdle(page);
        const ids = await getPointsIDs(page);
        await waitUntilRenderedFeatures(page, ids?.layerIDs as string[], 2, 5000);

        // Style swap drops MapLibre's image cache. The module must re-register the icon
        // before its symbol layer is added back, otherwise the layer would render against
        // a missing image.
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.hasImage('tt-blue'))).toBe(true);
        await waitUntilRenderedFeatures(page, ids?.layerIDs as string[], 2, 5000);

        // applyConfig with an additional image: new ID must register, existing one stays.
        await page.evaluate(() => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.customGeoJSON?.applyConfig({
                sources: {
                    points: {
                        layers: [
                            {
                                type: 'symbol',
                                layout: { 'icon-image': 'tt-red', 'icon-allow-overlap': true },
                            },
                        ],
                    },
                },
                images: {
                    'tt-blue': { image: mapsSdkThis.makeIcon('#0a3653') },
                    'tt-red': { image: mapsSdkThis.makeIcon('#dc2626') },
                },
            });
        });
        await waitForMapIdle(page);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.hasImage('tt-blue'))).toBe(true);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.hasImage('tt-red'))).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
