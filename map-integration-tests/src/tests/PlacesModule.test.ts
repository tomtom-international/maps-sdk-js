import { expect, test } from '@playwright/test';
import { type Place } from 'core';
import { sortBy } from 'lodash-es';
import type { PlaceDisplayProps } from 'map';
import type { LngLatLike, MapGeoJSONFeature } from 'maplibre-gl';
import { DEFAULT_PLACE_ICON_ID } from '../../../map/src/shared/layers/symbolLayers';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    applyPlacesTheme,
    clearPlaces,
    getNumVisiblePlacesLayers,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    setStyle,
    showPlaces,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

const compareToExpectedDisplayProps = (mapFeatures: MapGeoJSONFeature[], expectedDisplayProps: PlaceDisplayProps[]) => {
    const actualProps = mapFeatures.map((place) => ({
        id: place.properties.id,
        title: place.properties.title,
        iconID: place.properties.iconID,
    }));
    expect(actualProps).toMatchObject(expectedDisplayProps);
};

test.describe('PlacesModule tests', () => {
    test('Rendering a single place', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces(page);
        await showPlaces(page, {
            id: 'placeID',
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-75.43974, 39.82295] },
            properties: { address: { freeformAddress: 'Test Address' } },
        } as Place);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: 'placeID', iconID: `${DEFAULT_PLACE_ICON_ID}-0`, title: 'Test Address' },
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Rendering a place right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces(page);
        // realistically one shouldn't change the style right after initializing the map (it's the wrong way), so for this test we wait for the map to stabilize first:
        await waitForMapIdle(page);
        await setStyle(page, 'standardDark');
        await showPlaces(page, {
            id: 'placeID2',
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-75.43974, 39.82295] },
            properties: { address: { freeformAddress: 'Test Address' } },
        } as Place);

        await waitForMapIdle(page);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: 'placeID2', iconID: `${DEFAULT_PLACE_ICON_ID}-0`, title: 'Test Address' },
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Rendering a place with clear, reload, and state restoration', async ({ page }) => {
        const coordinates = [-75.43974, 39.82295];

        const testPlace = {
            type: 'Feature',
            id: 'test-place-123',
            geometry: { type: 'Point', coordinates },
            properties: {
                type: 'POI',
                poi: { name: 'Test Place', classifications: [{ code: 'RESTAURANT' }] },
            },
        } as Place;

        const expectedDisplayProps: PlaceDisplayProps[] = [
            { id: 'test-place-123', iconID: '7315', title: 'Test Place' },
        ];

        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: coordinates as LngLatLike, zoom: 14 });
        await initPlaces(page);
        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(0);

        await showPlaces(page, { type: 'FeatureCollection', features: [testPlace] });
        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        // once more, this time inputting the array of features, should yield same results:
        await showPlaces(page, testPlace);
        await waitForMapIdle(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 5000);
        compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        await clearPlaces(page);
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 0, 5000);
        expect(renderedPlaces).toHaveLength(0);
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Rendering a place with style changes and config application', async ({ page }) => {
        const testPlace = {
            type: 'Feature',
            id: '528009001852275',
            geometry: { type: 'Point', coordinates: [4.90047, 52.37708] },
            properties: {
                type: 'POI',
                address: { freeformAddress: 'Nieuwezijds Voorburgwal 67, 1012 RE Amsterdam' },
                poi: {
                    name: 'Q-Park Amsterdam Nieuwendijk',
                    classifications: [
                        {
                            code: 'PARKING_GARAGE',
                            names: [{ nameLocale: 'en-US', name: 'parking garage' }],
                        },
                    ],
                },
            },
        } as Place;

        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [4.90047, 52.37708], zoom: 14 });
        await initPlaces(page);
        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);

        // Show the test place
        await showPlaces(page, testPlace);
        let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces).toHaveLength(1);
        expect(renderedPlaces[0].properties.id).toBe('528009001852275');
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.iconID).toBe('7313');
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        // Change map style to 'monoLight'
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);

        // Verify that place is still shown
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces).toHaveLength(1);
        expect(renderedPlaces[0].properties.id).toBe('528009001852275');
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        // Apply config to 'base-map' theme
        await applyPlacesTheme(page, 'base-map');
        await waitForMapIdle(page);

        // Change map style to 'standardLight'
        await setStyle(page, 'standardLight');
        await waitForMapIdle(page);

        // Verify the place is still rendered with the right category for the applied theme
        renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        expect(renderedPlaces).toHaveLength(1);
        expect(renderedPlaces[0].properties.id).toBe('528009001852275');
        expect(renderedPlaces[0].properties.title).toBe('Q-Park Amsterdam Nieuwendijk');
        expect(renderedPlaces[0].properties.category).toBe('parking_facility');
        expect(await getNumVisiblePlacesLayers(page, sourceID)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Places module programmatic event state tests', () => {
    test('putEventState and cleanEventStates', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [-75.43974, 39.82295], zoom: 14 });
        await initPlaces(page);
        await showPlaces(page, [
            {
                type: 'Feature',
                id: 'A',
                geometry: { type: 'Point', coordinates: [-75.43974, 39.82295] },
                properties: { address: { freeformAddress: 'Test Address 1' } },
            } as Place,
            {
                type: 'Feature',
                id: 'B',
                geometry: { type: 'Point', coordinates: [-75.44974, 39.82295] },
                properties: { address: { freeformAddress: 'Test Address 2' } },
            } as Place,
        ]);

        const { layerIDs } = await getPlacesSourceAndLayerIDs(page);

        // we put event state on the first place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: 'hover' }));
        await waitForTimeout(1000);
        let renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 10000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBe('hover');
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        // we put event state on the second place without showing yet:
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.putEventState({ index: 1, state: 'hover', show: false }),
        );
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 5000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBe('hover');
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        // we put event state on the second place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 1, state: 'hover' }));
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 5000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBeUndefined();
        expect(renderedPlaces[1].properties.eventState).toBe('hover');

        // we add event state on the first place:
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: 'hover', mode: 'add' }),
        );
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 5000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBe('hover');
        expect(renderedPlaces[1].properties.eventState).toBe('hover');

        // we put click event state on the first place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: 'click' }));
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 5000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBe('click');
        expect(renderedPlaces[1].properties.eventState).toBe('hover');

        // we clean event states:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.cleanEventStates());
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(page, layerIDs, 2, 5000), 'id');
        expect(renderedPlaces[0].properties.eventState).toBeUndefined();
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
