import { expect, test } from '@playwright/test';
import { bboxFromGeoJSON, type Place } from '@tomtom-org/maps-sdk/core';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    applyPlacesIconConfig,
    applyPlacesTheme,
    getNumVisiblePlacesLayers,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    queryRenderedFeatures,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

test.describe('PlacesModule theme tests', () => {
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

    test('GeoJSON Places with init config tests', async ({ page }) => {
        const bounds = bboxFromGeoJSON(testPlace);
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds });
        await initPlaces(page, { theme: 'circle-icon' });
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await showPlaces(page, testPlace);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);

        expect(renderedPlaces).toHaveLength(1);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.iconID).toBe('poi-parking_facility');
        expect(renderedPlaces[0].properties.id).toBe('528009001852275');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Apply different themes and icon configs to a place', { tag: '@flaky' }, async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        // Wait for map idle so the pin-categories sprite (loaded async by
        // `addPinCategoriesSpriteToStyle`) is available before the first render query —
        // otherwise `iconID: '7313'` resolves to a missing sprite and the feature is dropped.
        await waitForMapIdle(page);
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await showPlaces(page, testPlace);

        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.iconID).toBe('7313');

        // Apply circle-icon theme
        await applyPlacesTheme(page, 'circle-icon');
        await waitForMapIdle(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.iconID).toBe('poi-parking_facility');

        // Apply custom icon config
        await applyPlacesIconConfig(page, {
            categoryIcons: [{ id: 'PARKING_GARAGE', image: 'https://dummyimage.com/30x20/4137ce/fff' }],
        });
        await waitForMapIdle(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.iconID).toBe('PARKING_GARAGE-0');

        // Apply base-map theme
        await applyPlacesTheme(page, 'base-map');
        await waitForMapIdle(page);
        renderedPlaces = await queryRenderedFeatures(page, layerIDs);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.category).toBe('parking_facility');
        expect(renderedPlaces[0].properties.group).toBe('parking');
        // We still have a custom icon applied:
        expect(renderedPlaces[0].properties.iconID).toBe('PARKING_GARAGE-0');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Base-map main/selected layers bind icon-image to iconID so custom sprites win', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });

        // The main/selected POI-like layers replace `icon-image` outright with
        // `['get','iconID']`, so custom `PlaceIconConfig.categoryIcons` sprites win there.
        // The micro layer inherits the style's `['get','group']` expression verbatim —
        // custom icons do NOT apply on micro.
        await initPlaces(page, { theme: 'base-map' });
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        const mainAndSelectedLayerIDs = layerIDs.filter((id) => id.endsWith('-main') || id.endsWith('-selected'));
        expect(mainAndSelectedLayerIDs).toHaveLength(2);
        const iconImages = await page.evaluate(
            (ids) => ids.map((id) => (globalThis as MapsSDKThis).mapLibreMap.getLayoutProperty(id, 'icon-image')),
            mainAndSelectedLayerIDs,
        );
        for (const iconImage of iconImages) {
            expect(Array.isArray(iconImage) && iconImage[0] === 'get' && iconImage[1] === 'iconID').toBe(true);
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Pin theme: applyIconConfig registers and renders the custom sprite', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        // Wait for the pin-categories sprite to finish loading before relying on '7313'.
        await waitForMapIdle(page);
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await showPlaces(page, testPlace);

        // Pin default: iconID is the POI category numeric ID
        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.iconID).toBe('7313');

        // Apply a custom icon for PARKING_GARAGE while staying on pin theme
        await applyPlacesIconConfig(page, {
            categoryIcons: [{ id: 'PARKING_GARAGE', image: 'https://dummyimage.com/30x20/4137ce/fff' }],
        });
        await waitForMapIdle(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);

        expect(renderedPlaces[0].properties.iconID).toBe('PARKING_GARAGE-0');

        // Regression: the custom sprite is registered with the map once the URL resolves,
        // and the deferred `updateData` re-emit in PlacesModule ensures MapLibre picks it
        // up without needing an external map interaction to trigger a repaint.
        const spriteRegistered = await page.evaluate(() =>
            (globalThis as MapsSDKThis).mapLibreMap.hasImage('PARKING_GARAGE-0'),
        );
        expect(spriteRegistered).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Rendering a place with 'base-map' theme renders on both 'main' and 'micro' layers", async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page, { theme: 'base-map' });
        await showPlaces(page, testPlace);
        await waitForMapIdle(page);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);

        // The 'base-map' theme stacks 'micro' under 'main' (plus the 'selected' layer shared
        // with other themes), so we expect 3 visible layers.
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(3);

        const mainLayerID = layerIDs.find((id) => id.endsWith('-main')) as string;
        const microLayerID = layerIDs.find((id) => id.endsWith('-micro')) as string;
        expect(mainLayerID).toBeDefined();
        expect(microLayerID).toBeDefined();

        // Assert the place is rendered by each layer independently — guards against
        // regressions where 'micro' (or 'main') silently drops out of rendering due to
        // style-inherited zoom/opacity gates or collision culling.
        const mainFeatures = await waitUntilRenderedFeatures(page, [mainLayerID], 1, 10000);
        expect(mainFeatures).toHaveLength(1);
        expect(mainFeatures[0].properties.id).toBe('528009001852275');

        // micro features are behind the main ones but don't have collision rules (always shown):
        const microFeatures = await waitUntilRenderedFeatures(page, [microLayerID], 1, 10000);
        expect(microFeatures).toHaveLength(1);
        expect(microFeatures[0].properties.id).toBe('528009001852275');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("'base-map' with 'main' hidden renders the place only through the 'micro' layer", { tag: '@flaky' }, async ({
        page,
    }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        // Hide the `main` layer so only the `micro` layer renders.
        await initPlaces(page, { theme: 'base-map', layers: { main: { layout: { visibility: 'none' } } } });
        await showPlaces(page, testPlace);
        await waitForMapIdle(page);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);

        // `main` is hidden by config so it drops out of the visible-layer count. `selected`
        // stays registered with `visibility: 'visible'` (its emptiness is filter-driven, not
        // visibility-driven), so it keeps counting — leaving `selected` + `micro` = 2 visible
        // layers even though only `micro` actually renders a feature.
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        const mainLayerID = layerIDs.find((id) => id.endsWith('-main')) as string;
        const microLayerID = layerIDs.find((id) => id.endsWith('-micro')) as string;
        const selectedLayerID = layerIDs.find((id) => id.endsWith('-selected')) as string;

        const microFeatures = await waitUntilRenderedFeatures(page, [microLayerID], 1, 10000);
        expect(microFeatures).toHaveLength(1);
        expect(microFeatures[0].properties.id).toBe('528009001852275');

        // `main` is hidden via the `layers.main.layout.visibility = 'none'` config override.
        expect(await queryRenderedFeatures(page, [mainLayerID])).toHaveLength(0);
        // `selected` stays empty because its `has eventState` filter matches nothing here.
        expect(await queryRenderedFeatures(page, [selectedLayerID])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
