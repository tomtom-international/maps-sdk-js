import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Places } from 'core';
import placesJson from './data/PlacesModuleEvents.test.data.json';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getCursor,
    getNumHoversAndLongHovers,
    getNumLeftAndRightClicks,
    getPixelCoords,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    setStyle,
    showPlaces,
    waitForEventState,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

const deRegisterPlacesClickHandlers = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).places?.events.off('click'));

const setupPlacesHoverHandlers = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.places?.events.on('hover', () => mapsSdkThis._numOfHovers++);
        mapsSdkThis.places?.events.on('long-hover', () => mapsSdkThis._numOfLongHovers++);
    });

const setupPlacesClickHandler = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.places?.events.on('click', (topFeature, lnglat, features, sourceWithLayers) => {
            mapsSdkThis._numOfClicks++;
            mapsSdkThis._clickedTopFeature = topFeature;
            mapsSdkThis._clickedLngLat = lnglat;
            mapsSdkThis._clickedFeatures = features;
            mapsSdkThis._clickedSourceWithLayers = sourceWithLayers;
        });
        mapsSdkThis.places?.events.on('contextmenu', () => mapsSdkThis._numOfContextmenuClicks++);
    });

const places = placesJson as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];

test.describe('Tests with user events related to PlacesModule', () => {
    const mapEnv = new MapTestEnv();

    // Reset test variables for each test
    test.beforeEach(async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.34313] }, // Amsterdam center
            {
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                eventsConfig: { longHoverDelayAfterMapMoveMS: 4500, longHoverDelayOnStillMapMS: 4000 },
            },
        );
    });

    test('Click and contextmenu events for places', async ({ page }) => {
        await initPlaces(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs(page)).layerIDs;
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);

        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await waitForEventState(page, undefined, placesLayerIDs);

        // (we haven't registered click events yet)
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(page, undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks(page)).toEqual([0, 0]);

        await setupPlacesClickHandler(page);
        await waitForTimeout(1000);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(page, 'click', placesLayerIDs);
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 0]);

        await page.mouse.click(placePixelCoords.x, placePixelCoords.y, { button: 'right' });
        await waitForEventState(page, 'contextmenu', placesLayerIDs);
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 1]);

        // clicking away:
        await page.mouse.click(placePixelCoords.x - 100, placePixelCoords.y - 100);
        await waitForEventState(page, undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 1]);

        // unregistering handlers, clicking again and asserting nothing happens:
        await deRegisterPlacesClickHandlers(page);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(page, undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Hover and long hover states for a place', async ({ page }) => {
        await initPlaces(page);
        await waitForMapIdle(page);
        const placePosition = await getPixelCoords(page, firstPlacePosition);
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs(page)).layerIDs;
        await showPlaces(page, places);
        await waitForMapIdle(page);
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);

        await setupPlacesHoverHandlers(page);
        expect(await getNumHoversAndLongHovers(page)).toEqual([0, 0]);

        // Moving cursor over the place (hovering)
        await page.mouse.move(placePosition.x, placePosition.y);
        expect(await getNumHoversAndLongHovers(page)).toEqual([1, 0]);
        await waitForEventState(page, 'hover', placesLayerIDs);

        // Moving cursor away from the place
        await page.mouse.move(placePosition.x - 100, placePosition.y - 75);
        expect(await getNumHoversAndLongHovers(page)).toEqual([1, 0]);
        await waitForEventState(page, undefined, placesLayerIDs);
        // double-checking we still have the same number of rendered places:
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 3000);

        // Moving the cursor back to the place
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState(page, 'hover', placesLayerIDs);
        // Waiting for a long-hover:
        await waitForTimeout(4000);
        await waitForEventState(page, 'long-hover', placesLayerIDs);
        expect(await getNumHoversAndLongHovers(page)).toEqual([2, 1]);

        // Moving away again:
        await page.mouse.move(placePosition.x - 100, placePosition.y - 75);
        await waitForEventState(page, undefined, placesLayerIDs);
        expect(await getNumHoversAndLongHovers(page)).toEqual([2, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Hover events for a place shown right after changing map style', async ({ page }) => {
        // This is a "stress" test to ensure events keep functioning properly after changing styles, restoring places, etc.
        await initPlaces(page);
        await setupPlacesClickHandler(page);
        // We load the places layer IDs before changing the style, to ensure they are still relevant after the style change:
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs(page)).layerIDs;

        await setStyle(page, 'standardDark');

        // We show the places after the map style has changed.
        // Now we'll test whether the events still work properly
        // (internally meaning that the source and layers proper reference is still in the events proxy when restoring the PlacesModule after the style change):
        await showPlaces(page, places);
        await waitForMapIdle(page);
        const placePosition = await getPixelCoords(page, firstPlacePosition);
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);
        // Moving cursor over the place (hovering)
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState(page, 'hover', placesLayerIDs);
        // double-checking we still have the same number of rendered places:
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);
    });

    test('Callback handler arguments', async ({ page }) => {
        await initPlaces(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs(page)).layerIDs;
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);

        await setupPlacesClickHandler(page);

        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);

        const lngLat = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedLngLat);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        const layerSpecs = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedSourceWithLayers?._layerSpecs);

        expect(lngLat).toMatchObject({ lng: expect.any(Number), lat: expect.any(Number) });
        expect(features).toHaveLength(1);
        expect(features).toContainEqual(expect.objectContaining({ type: 'Feature' }));
        expect(layerSpecs).toHaveLength(2);
        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
        expect(layerSpecs).toEqual([
            expect.objectContaining({ source: sourceID, id: layerIDs[0] }),
            expect.objectContaining({ source: sourceID, id: layerIDs[1] }),
        ]);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Events custom configuration', () => {
    const mapEnv = new MapTestEnv();

    test('Custom cursor', async ({ page }) => {
        // Amsterdam center
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.37313] },
            {
                eventsConfig: {
                    cursorOnMap: 'help',
                    cursorOnMouseDown: 'crosshair',
                    cursorOnHover: 'wait',
                },
            },
        );

        await initPlaces(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);
        expect(await getCursor(page)).toBe('help');
        await page.mouse.down();
        expect(await getCursor(page)).toBe('crosshair');
        await page.mouse.up();
        expect(await getCursor(page)).toBe('help');

        await setupPlacesHoverHandlers(page);
        await waitForTimeout(1000);
        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor(page)).toBe('wait');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Point precision mode', async ({ page }) => {
        // Amsterdam center
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.35313] },
            { eventsConfig: { precisionMode: 'point' } },
        );

        await initPlaces(page);
        await showPlaces(page, places);
        await setupPlacesHoverHandlers(page);
        await waitForMapIdle(page);

        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor(page)).toBe('pointer');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Point-then-box precision mode', async ({ page }) => {
        // Amsterdam center
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.37313] },
            { eventsConfig: { precisionMode: 'point-then-box' } },
        );

        await initPlaces(page);
        await setupPlacesHoverHandlers(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);

        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor(page)).toBe('pointer');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
