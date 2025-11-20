import { expect, test } from '@playwright/test';
import { bboxFromGeoJSON, type Place } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { MapTestEnv } from './util/MapTestEnv';
import {
    applyPlacesIconConfig,
    applyPlacesTheme,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    queryRenderedFeatures,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

test.describe('GeoJSON Places apply different configs', () => {
    const testPlace: Place = {
        type: 'Feature',
        id: '528009001852275',
        geometry: { type: 'Point', coordinates: [4.90047, 52.37708] },
        properties: {
            type: 'POI',
            address: { freeformAddress: 'Nieuwezijds Voorburgwal 67, 1012 RE Amsterdam' },
            poi: {
                name: 'Q-Park Amsterdam Nieuwendijk',
                categoryIds: [7364],
                classifications: [
                    {
                        code: 'PARKING_GARAGE',
                        names: [{ nameLocale: 'en-US', name: 'parking garage' }],
                    },
                ],
            },
        },
    };

    test('GeoJSON Places with init config tests', async ({ page }) => {
        const bounds = bboxFromGeoJSON(testPlace) as LngLatBoundsLike;
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds });
        await initPlaces(page, { theme: 'circle' });
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await showPlaces(page, testPlace);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);

        expect(renderedPlaces).toHaveLength(1);
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.iconID).toBe('poi-parking_facility');
        expect(renderedPlaces[0].properties.id).toBe('528009001852275');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Apply different themes and icon configs to a place', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
        await showPlaces(page, testPlace);

        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces[0].properties.iconID).toBe('7364');

        // Apply circle theme
        await applyPlacesTheme(page, 'circle');
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
        // We still have a custom icon applied:
        expect(renderedPlaces[0].properties.iconID).toBe('PARKING_GARAGE-0');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
