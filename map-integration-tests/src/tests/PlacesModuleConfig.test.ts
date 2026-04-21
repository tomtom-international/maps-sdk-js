import { expect, test } from '@playwright/test';
import { type Place } from '@tomtom-org/maps-sdk/core';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getPaintProperty,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

test.describe('PlacesModule config API tests', () => {
    const testPlace: Place = {
        type: 'Feature',
        id: '528009001852275',
        geometry: { type: 'Point', coordinates: [4.90047, 52.37708] },
        properties: {
            type: 'POI',
            address: { freeformAddress: 'Nieuwezijds Voorburgwal 67, 1012 RE Amsterdam' },
            poi: {
                name: 'Q-Park Amsterdam Nieuwendijk',
                categories: ['PARKING_GARAGE'],
                localizedCategories: ['parking'],
            },
        },
    };

    test('applyTextConfig updates text-color on the visible places layers', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        await waitForMapIdle(page);
        await showPlaces(page, testPlace);

        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);

        // Apply a distinctive color so we can assert it was propagated to every
        // visible layer's `text-color` paint property.
        const customColor = '#FF00FF';
        await page.evaluate((color) => (globalThis as MapsSDKThis).places?.applyTextConfig({ color }), customColor);
        await waitForMapIdle(page);

        const mainLayerID = layerIDs.find((id) => id.endsWith('-main')) as string;
        const selectedLayerID = layerIDs.find((id) => id.endsWith('-selected')) as string;
        expect(mainLayerID).toBeDefined();
        expect(selectedLayerID).toBeDefined();

        expect(await getPaintProperty(page, mainLayerID, 'text-color')).toBe(customColor);
        // `selected` defines its own text-color for the highlight style, so config-provided
        // color overrides it on that layer as well.
        expect(await getPaintProperty(page, selectedLayerID, 'text-color')).toBe(customColor);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyTextConfig with a data-driven field updates the rendered title', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        await waitForMapIdle(page);
        await showPlaces(page, testPlace);

        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');

        // Swap the title to the freeform address via a function-based field.
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.applyTextConfig({
                title: (place) => place.properties.address?.freeformAddress,
            }),
        );
        await waitForMapIdle(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.title).toBe('Nieuwezijds Voorburgwal 67, 1012 RE Amsterdam');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('applyExtraFeatureProps adds computed and static properties to rendered features', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        await waitForMapIdle(page);
        await showPlaces(page, testPlace);

        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.applyExtraFeatureProps({
                firstCategory: (place: Place) => place.properties.poi?.categories?.[0],
                isOpen: true,
            }),
        );
        await waitForMapIdle(page);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.firstCategory).toBe('PARKING_GARAGE');
        expect(renderedPlaces[0].properties.isOpen).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
