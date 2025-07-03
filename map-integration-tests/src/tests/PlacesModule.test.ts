import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Place, Places } from 'core';
import { bboxFromGeoJSON } from 'core/src/util';
import sortBy from 'lodash/sortBy';
import type { LocationDisplayProps, PlaceIconConfig } from 'map';
import type { LngLatBoundsLike, MapGeoJSONFeature } from 'maplibre-gl';
import placesTestData from './data/PlacesModule.test.data.json';
import expectedCustomIcon from './data/PlacesModuleCustomIcon.test.data.json';
import expectedPoiLikeFeatureProps from './data/PlacesModulePOILikeProps.test.data.json';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumVisibleLayersBySource,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    initTrafficIncidents,
    queryRenderedFeatures,
    setStyle,
    showPlaces,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

const applyIconConfig = async (page: Page, iconConfig?: PlaceIconConfig) =>
    page.evaluate(
        async (inputConfig) => (globalThis as MapsSDKThis).places?.applyIconConfig(inputConfig),
        iconConfig as PlaceIconConfig,
    );

const clearPlaces = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).places?.clear());

const getNumVisibleLayers = async (page: Page, sourceId: string) => getNumVisibleLayersBySource(page, sourceId);

const compareToExpectedDisplayProps = (places: MapGeoJSONFeature[], expectedDisplayProps: LocationDisplayProps[]) =>
    expect(
        sortBy(
            places.map((place) => ({
                id: place.properties.id,
                title: place.properties.title,
                iconID: place.properties.iconID,
            })),
            'title',
        ),
    ).toEqual(sortBy(expectedDisplayProps, 'title'));

const compareToExpectedPoiLikeDisplayProps = (
    places: MapGeoJSONFeature[],
    expectedDisplayProps: LocationDisplayProps[],
) => {
    for (const place of places) {
        const expectedDisplayProp = expectedDisplayProps.find((props) => props.title === place.properties.title);
        expect({
            title: place.properties.title,
            iconID: place.properties.iconID,
            category: place.properties.category,
        }).toEqual(expectedDisplayProp);
    }
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
        expect(await getNumVisibleLayers(page, sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: 'placeID', iconID: 'default_pin', title: 'Test Address' },
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Rendering a place right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces(page);
        await setStyle(page, 'standardDark');
        await showPlaces(page, {
            id: 'placeID2',
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-75.43974, 39.82295] },
            properties: { address: { freeformAddress: 'Test Address' } },
        } as Place);

        await waitForMapIdle(page);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
        expect(await getNumVisibleLayers(page, sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: 'placeID2', iconID: 'default_pin', title: 'Test Address' },
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    for (const testData of placesTestData as [string, Places, LocationDisplayProps[]][]) {
        test(testData[0], async ({ page }) => {
            const [_name, testPlaces, expectedDisplayProps] = testData;
            const bounds = bboxFromGeoJSON(testPlaces) as LngLatBoundsLike;
            const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds });
            await initPlaces(page);
            const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs(page);
            expect(await getNumVisibleLayers(page, sourceID)).toBe(0);

            await showPlaces(page, testPlaces);
            const numTestPlaces = testPlaces.features.length;
            let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(page, sourceID)).toBe(2);

            // once more, this time inputting the array of features, should yield same results:
            await showPlaces(page, testPlaces.features);
            await waitForMapIdle(page);
            renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, numTestPlaces, 5000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(page, sourceID)).toBe(2);

            await clearPlaces(page);
            renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, 0, 5000);
            expect(renderedPlaces).toHaveLength(0);
            expect(await getNumVisibleLayers(page, sourceID)).toBe(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);

            // once more, reloading the map, showing the same again:
            await mapEnv.loadPageAndMap(page, { bounds });
            await initPlaces(page);
            const { layerIDs: nextLayerIDs } = await getPlacesSourceAndLayerIDs(page);
            await showPlaces(page, testPlaces);
            renderedPlaces = await waitUntilRenderedFeatures(page, nextLayerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            // adding traffic incidents to the style: verifying the places are still shown (state restoration):
            await initTrafficIncidents(page, { ensureAddedToStyle: true });
            await waitForMapIdle(page);
            renderedPlaces = await waitUntilRenderedFeatures(page, nextLayerIDs, numTestPlaces, 5000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            // changing the map style: verifying the places are still shown (state restoration):
            await setStyle(page, 'standardDark');
            await waitForMapIdle(page);
            renderedPlaces = await waitUntilRenderedFeatures(page, nextLayerIDs, numTestPlaces, 5000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    }
});

test.describe('GeoJSON Places with init config tests', () => {
    for (const testData of placesTestData as [string, Places, LocationDisplayProps[], LocationDisplayProps[]][]) {
        test(testData[0], async ({ page }) => {
            const [_name, testPlaces, _expectedDisplayProps, expectedDisplayCustomProps] = testData;

            const bounds = bboxFromGeoJSON(testPlaces) as LngLatBoundsLike;
            const mapEnv = await MapTestEnv.loadPageAndMap(
                page,
                { bounds },
                { style: { type: 'published', include: ['trafficIncidents', 'trafficFlow', 'hillshade'] } },
            );
            await initPlaces(page, { iconConfig: { iconStyle: 'circle' } });
            const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
            await showPlaces(page, testPlaces);
            const numTestPlaces = testPlaces.features.length;
            const renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayCustomProps);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    }
});

test.describe('GeoJSON Places apply icon config tests', () => {
    for (const testData of placesTestData as [string, Places, LocationDisplayProps[], LocationDisplayProps[]][]) {
        test(testData[0], async ({ page }) => {
            const [name, testPlaces, _expectedDisplayProps, expectedDisplayCustomProps] = testData;

            const bounds = bboxFromGeoJSON(testPlaces) as LngLatBoundsLike;
            const mapEnv = await MapTestEnv.loadPageAndMap(
                page,
                { bounds },
                { style: { type: 'published', include: ['trafficIncidents', 'trafficFlow', 'hillshade'] } },
            );
            await initPlaces(page);
            const { layerIDs } = await getPlacesSourceAndLayerIDs(page);
            await showPlaces(page, testPlaces);

            const numTestPlaces = testPlaces.features.length;
            await applyIconConfig(page, { iconStyle: 'circle' });
            await waitForMapIdle(page);
            let renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayCustomProps);

            await applyIconConfig(page, {
                customIcons: [{ category: 'PARKING_GARAGE', iconUrl: 'https://dummyimage.com/30x20/4137ce/fff' }],
            });
            await waitForMapIdle(page);
            renderedPlaces = await waitUntilRenderedFeatures(page, layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedCustomIcon[name as never]);

            await applyIconConfig(page, { iconStyle: 'poi-like' });
            await waitForMapIdle(page);
            // poi-like places avoid collisions, thus likely resulting in less num of rendered features:
            renderedPlaces = await queryRenderedFeatures(page, layerIDs);
            compareToExpectedPoiLikeDisplayProps(renderedPlaces, expectedPoiLikeFeatureProps[name as never]);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    }
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
