import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Point, Position } from 'geojson';
import type { FilterablePOICategory, POIsModuleFeature } from 'map';
import { getStyleCategories, poiLayerIDs } from 'map';
import type { FilterSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumVisiblePOILayers,
    getPixelCoords,
    initPOIs,
    queryRenderedFeatures,
    waitForMapIdle,
    waitUntilRenderedFeaturesChange,
} from './util/TestUtils';

const waitForRenderedPoIsChange = async (page: Page, previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(page, ['POI'], previousFeaturesCount, 10000);

const areSomeCategoriesIncluded = (renderedPoIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) =>
    renderedPoIs
        .map((poi) => poi.properties.category)
        .some((category) => getStyleCategories(filteredCategories).includes(category));

const areAllCategoriesIncluded = (renderedPoIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) =>
    renderedPoIs
        .map((poi) => poi.properties.category)
        .every((category) => getStyleCategories(filteredCategories).includes(category));

test.describe('Map vector tile POI filtering tests', () => {
    test('Vector tiles pois visibility changes in different ways', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

        await initPOIs(page, { visible: false });
        expect(await getNumVisiblePOILayers(page)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisiblePOILayers(page)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisiblePOILayers(page)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: true }));
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await getNumVisiblePOILayers(page)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({}));
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Vector tiles pois filter starting with no config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 16, center: [-0.12621, 51.50154] });
        await initPOIs(page);
        await waitForMapIdle(page);
        let renderedPoIs = await waitForRenderedPoIsChange(page, 0);
        expect(areSomeCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'])).toBe(
            true,
        );

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION, expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: 'all_except',
                values: ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'],
            }),
        );
        await waitForMapIdle(page);
        renderedPoIs = await queryRenderedFeatures(page, ['POI']);
        expect(areSomeCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'])).toBe(
            false,
        );

        // change filter config to show "only" TRANSPORTATION_GROUP and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({ show: 'only', values: ['TRANSPORTATION_GROUP'] }),
        );
        await waitForMapIdle(page);
        renderedPoIs = await queryRenderedFeatures(page, ['POI']);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP'])).toBe(true);

        // resetting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await waitForMapIdle(page);

        renderedPoIs = await queryRenderedFeatures(page, ['POI']);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areSomeCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'])).toBe(
            true,
        );
        expect(areAllCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP'])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Vector tiles pois filter while initializing with config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 16, center: [-0.12621, 51.50154] });
        // config poi layer to only include TRANSPORTATION_GROUP categories and expect all features to be from TRANSPORTATION_GROUP
        await initPOIs(page, { filters: { categories: { show: 'only', values: ['TRANSPORTATION_GROUP'] } } });
        await waitForMapIdle(page);

        let renderedPoIs = await waitForRenderedPoIsChange(page, 0);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP'])).toBe(true);

        // set filter to include only and expect all features to be from the included category values
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: 'only',
                values: ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'],
            }),
        );
        await waitForMapIdle(page);
        renderedPoIs = await waitForRenderedPoIsChange(page, renderedPoIs.length);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP', 'IMPORTANT_TOURIST_ATTRACTION'])).toBe(
            true,
        );

        // change filter settings to exclude TRANSPORTATION_GROUP and expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: 'all_except',
                values: ['TRANSPORTATION_GROUP'],
            }),
        );
        await waitForMapIdle(page);
        renderedPoIs = await waitForRenderedPoIsChange(page, renderedPoIs.length);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areSomeCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP'])).toBe(false);

        // setting visibility to false:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await getNumVisiblePOILayers(page)).toBe(0);
        await waitForMapIdle(page);
        renderedPoIs = await waitForRenderedPoIsChange(page, renderedPoIs.length);
        expect(renderedPoIs).toHaveLength(0);

        // re-setting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await getNumVisiblePOILayers(page)).toBe(poiLayerIDs.length);
        await waitForMapIdle(page);
        renderedPoIs = await waitForRenderedPoIsChange(page, renderedPoIs.length);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['TRANSPORTATION_GROUP'])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Vector tiles pois filter with manual set filter before category filter', async ({ page }) => {
        const existingFilter: FilterSpecification = [
            'any',
            // IMPORTANT_TOURIST_ATTRACTION
            ['==', ['get', 'category'], 'tourist_attraction'],
            // RAILROAD_STATION
            ['==', ['get', 'category'], 'railway_station'],
        ];
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 16, center: [-0.12621, 51.50154] });
        await initPOIs(page);

        // manually override existing POI layer filter to be able to verify it's combined with categories filter
        await page.evaluateHandle(
            (inputExistingFilter) => (globalThis as MapsSDKThis).mapLibreMap.setFilter('POI', inputExistingFilter),
            existingFilter,
        );
        await page.evaluate((inputExistingFilter) =>
            // overriding existing layerFilter with the applied filters only for test purposes
            {
                // @ts-ignore
                (globalThis as MapsSDKThis).pois.originalFilter = inputExistingFilter;
            }, existingFilter);
        await waitForMapIdle(page);
        let renderedPoIs = await waitForRenderedPoIsChange(page, 0);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['IMPORTANT_TOURIST_ATTRACTION', 'RAILWAY_STATION'])).toBe(true);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: 'all_except',
                values: ['IMPORTANT_TOURIST_ATTRACTION'],
            }),
        );
        await waitForMapIdle(page);
        renderedPoIs = await waitForRenderedPoIsChange(page, renderedPoIs.length);
        expect(renderedPoIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPoIs, ['RAILWAY_STATION'])).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Map vector tile POI feature tests', () => {
    test('Ensure required feature properties are defined', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

        await initPOIs(page);
        await waitForMapIdle(page);

        const poiCoordinates: Position = await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            const geometry = mapsSdkThis.mapLibreMap.queryRenderedFeatures({ layers: ['POI'] })[0].geometry as Point;
            return geometry.coordinates;
        });

        const pixelCoordinates = await getPixelCoords(page, poiCoordinates);

        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            mapsSdkThis.pois?.events.on('click', (topFeature) => {
                mapsSdkThis._clickedTopFeature = topFeature;
            });
        });

        await page.mouse.click(pixelCoordinates.x, pixelCoordinates.y);

        const clickedFeature = (await page.evaluate(
            async () => (globalThis as MapsSDKThis)._clickedTopFeature,
        )) as POIsModuleFeature;

        expect(clickedFeature.properties.id).toBeDefined();
        expect(clickedFeature.properties.name).toBeDefined();
        expect(clickedFeature.properties.category).toBeDefined();
        expect(clickedFeature.properties.group).toBeDefined();
        expect(clickedFeature.properties.priority).toBeDefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
