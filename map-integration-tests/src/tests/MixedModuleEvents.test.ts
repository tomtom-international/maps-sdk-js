import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Place, Places, PolygonFeatures } from 'core';
import type { Position } from 'geojson';
import { BASE_MAP_SOURCE_ID } from 'map';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import amsterdamGeometryData from './data/GeometriesModule.test.data.json';
import placesJson from './data/PlacesModuleEvents.test.data.json';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getClickedTopFeature,
    getGeometriesSourceAndLayerIDs,
    getPixelCoords,
    getPlacesSourceAndLayerIDs,
    initBasemap,
    initGeometries,
    initPlaces,
    setStyle,
    showGeometry,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

const places = placesJson as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];
const geometryData = amsterdamGeometryData as PolygonFeatures;

const setupGeometryHoverHandlers = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.geometries?.events.on('hover', () => mapsSdkThis._numOfHovers++);
        mapsSdkThis.geometries?.events.on('long-hover', () => mapsSdkThis._numOfLongHovers++);
    });

const setupPlacesClickHandler = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.places?.events.on('click', (topFeature, _, features) => {
            mapsSdkThis._clickedTopFeature = topFeature;
            mapsSdkThis._clickedFeatures = features;
        });
        mapsSdkThis.places?.events.on('contextmenu', () => mapsSdkThis._numOfContextmenuClicks++);
    });

const waitUntilRenderedGeometry = async (
    page: Page,
    numFeatures: number,
    position: Position,
    layerIDs: string[],
): Promise<MapGeoJSONFeature[]> => waitUntilRenderedFeatures(page, layerIDs, numFeatures, 3000, position);

const setupBasemapClickHandler = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.baseMap?.events.on('click', (topFeature, _, features) => {
            mapsSdkThis._clickedTopFeature = topFeature;
            mapsSdkThis._clickedFeatures = features;
        });
    });

test.describe('Tests with user events', () => {
    const mapEnv = new MapTestEnv();

    // Reset test variables for each test
    test.beforeEach(async ({ page }) => {
        await mapEnv.loadPageAndMap(
            page,
            { zoom: 10, center: [4.89067, 52.34313] }, // Amsterdam center
            {
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                eventsConfig: { longHoverDelayAfterMapMoveMS: 3500, longHoverDelayOnStillMapMS: 3000 },
            },
        );
    });

    test('Events combining different map modules', async ({ page }) => {
        await initGeometries(page);
        await showGeometry(page, geometryData);
        const geometrySourcesAndLayerIDs = await getGeometriesSourceAndLayerIDs(page);
        await waitUntilRenderedGeometry(
            page,
            1,
            [4.89067, 52.37313],
            geometrySourcesAndLayerIDs?.geometry.layerIDs as string[],
        );

        await initPlaces(page);
        await showPlaces(page, places);
        await waitForMapIdle(page);
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs(page)).layerIDs;
        await waitUntilRenderedFeatures(page, placesLayerIDs, places.features.length, 5000);
        // Setting up handlers for places:
        await setupPlacesClickHandler(page);

        // We click in the place and should not have a geometry module returned in features parameter
        const placePixelCoords = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        expect(features).toHaveLength(1);
        expect(features?.[0].layer.id).toEqual(placesLayerIDs[0]);

        // we register a hover handler for geometries
        await setupGeometryHoverHandlers(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Events with Places and BaseMap modules', async ({ page }) => {
        await initBasemap(page);
        await initPlaces(page, { iconConfig: { iconStyle: 'circle' } });
        await showPlaces(page, places);
        await waitForMapIdle(page);

        // changing the style in between, to double-check that we can still register to events in base map after:
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);
        await setupBasemapClickHandler(page);

        // Click on a POI and gets the under layer from basemap as we don't have a event register por Places.
        const placePosition = await getPixelCoords(page, firstPlacePosition);
        await page.mouse.click(placePosition.x, placePosition.y);
        const topBaseMapFeature = await getClickedTopFeature(page);
        expect(topBaseMapFeature?.source).toBe(BASE_MAP_SOURCE_ID);

        await setupPlacesClickHandler(page);

        await page.mouse.click(placePosition.x, placePosition.y);
        const topPlaceFeature = await getClickedTopFeature<Place>(page);
        expect(topPlaceFeature).toEqual({
            ...places.features[0],
            properties: {
                ...places.features[0].properties,
                eventState: 'click',
                iconID: 'poi-parking_facility',
                title: 'H32 Sportfondsenbad Amsterdam-Oost',
                id: expect.anything(),
            },
        });
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
