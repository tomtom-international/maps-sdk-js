import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { PolygonFeatures } from 'core';
import type { Position } from 'geojson';
import type { DisplayGeometryProps, GeometryBeforeLayerConfig } from 'map';
import { mapStyleLayerIDs } from 'map/src/shared';
import type { LngLatBoundsLike, MapGeoJSONFeature } from 'maplibre-gl';
import amsterdamGeometryData from './data/GeometriesModule.test.data.json';
import netherlandsGeometryData from './data/GeometriesModule-Netherlands.test.data.json';
import type { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getGeometriesSourceAndLayerIDs,
    getLayerByID,
    getNumVisibleLayersBySource,
    initGeometries,
    queryRenderedFeatures,
    setStyle,
    showGeometry,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
} from './util/TestUtils';

const getNumVisibleLayers = async (page: Page, sourceId: string) => getNumVisibleLayersBySource(page, sourceId);

const getNumVisibleTitleLayers = async (page: Page, sourceId: string) => getNumVisibleLayersBySource(page, sourceId);

const clearGeometry = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).geometries?.clear());

const moveBeforeLayer = async (page: Page, config: GeometryBeforeLayerConfig) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).geometries?.moveBeforeLayer(inputConfig), config);

const getAllLayers = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.getStyle().layers);

const waitUntilRenderedGeometry = async (
    page: Page,
    numFeatures: number,
    position: Position,
    layerIDs: string[],
): Promise<MapGeoJSONFeature[]> => waitUntilRenderedFeatures(page, layerIDs, numFeatures, 3000, position);

test.describe('Geometry integration tests', () => {
    const geometryData = amsterdamGeometryData as PolygonFeatures;
    const netherlandsData = netherlandsGeometryData as unknown as PolygonFeatures<DisplayGeometryProps>;

    const amsterdamCenter = [4.89067, 52.37313];
    // point in Amsterdam South East which fits inside a separate polygon:
    const amsterdamSouthEast = [4.99225, 52.30551];
    const outsideAmsterdamNorth = [4.93236, 52.41518];
    const outsideAmsterdamSouth = [4.8799, 52.3087];

    test('Show a geometry on the map, default module config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: geometryData.bbox as LngLatBoundsLike });
        await initGeometries(page);
        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs(page);
        const sourceId = sourcesAndLayers?.geometry?.sourceID as string;
        await waitForMapIdle(page);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(0);

        await showGeometry(page, geometryData);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(2);
        // non-inverted polygon: fills inside but not the edges:
        const layerIDs = sourcesAndLayers?.geometry?.layerIDs as string[];
        await waitUntilRenderedGeometry(page, 1, amsterdamCenter, layerIDs);
        await waitUntilRenderedGeometry(page, 1, amsterdamSouthEast, layerIDs);
        await waitUntilRenderedGeometry(page, 0, outsideAmsterdamNorth, layerIDs);
        await waitUntilRenderedGeometry(page, 0, outsideAmsterdamSouth, layerIDs);

        await clearGeometry(page);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(0);
        await showGeometry(page, geometryData);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Show a geometry on the map right after changing the map style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: geometryData.bbox as LngLatBoundsLike });
        await initGeometries(page);
        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs(page);
        const sourceId = sourcesAndLayers?.geometry?.sourceID as string;
        await setStyle(page, 'standardDark');
        await showGeometry(page, geometryData);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);

        // non-inverted polygon: fills inside but not the edges:
        const layerIDs = sourcesAndLayers?.geometry?.layerIDs as string[];
        await waitUntilRenderedGeometry(page, 1, amsterdamCenter, layerIDs);
        await waitUntilRenderedGeometry(page, 1, amsterdamSouthEast, layerIDs);
        await waitUntilRenderedGeometry(page, 0, outsideAmsterdamNorth, layerIDs);
        await waitUntilRenderedGeometry(page, 0, outsideAmsterdamSouth, layerIDs);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(2);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Show multiple geometries in the map with title, default config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: netherlandsData.bbox as LngLatBoundsLike });
        await initGeometries(page);

        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs(page);
        const sourceId = sourcesAndLayers?.geometry?.sourceID as string;
        const titleSourceId = sourcesAndLayers?.geometryLabel?.sourceID as string;
        const titleLayerIDs = sourcesAndLayers?.geometryLabel?.layerIDs as string[];

        expect(await getNumVisibleLayers(page, sourceId)).toBe(0);
        await showGeometry(page, netherlandsData);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(2);
        expect(await getNumVisibleTitleLayers(page, titleSourceId)).toBe(1);

        await waitForMapIdle(page);
        const features = await queryRenderedFeatures(page, titleLayerIDs);
        expect(features).toHaveLength(12);
        features.forEach((feature) => {
            expect(feature).toMatchObject({
                properties: { title: JSON.parse(feature.properties.address).freeformAddress },
            });
        });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Show multiple geometries in the map with title, custom config', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: netherlandsData.bbox as LngLatBoundsLike });
        await initGeometries(page, {
            colorConfig: { fillColor: '#00ccbb', fillOpacity: 0.6 },
            textConfig: { textField: 'CustomText' },
        });
        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs(page);
        const sourceId = sourcesAndLayers?.geometry?.sourceID as string;
        const layerIDs = sourcesAndLayers?.geometry?.layerIDs as string[];
        const firstGeometryLayerId = layerIDs[0];
        const titleSourceId = sourcesAndLayers?.geometryLabel?.sourceID as string;
        const titleLayerIDs = sourcesAndLayers?.geometryLabel?.layerIDs as string[];

        expect(await getNumVisibleLayers(page, sourceId)).toBe(0);

        await showGeometry(page, netherlandsData);
        expect(await getNumVisibleLayers(page, sourceId)).toBe(2);
        expect(await getNumVisibleTitleLayers(page, titleSourceId)).toBe(1);

        await waitForMapIdle(page);
        const features = await queryRenderedFeatures(page, titleLayerIDs);
        expect(features).toHaveLength(12);
        features.forEach((feature) => {
            expect(feature).toMatchObject({ properties: { title: 'CustomText', color: '#00ccbb' } });
        });

        const geometryFillLayer = await getLayerByID(page, firstGeometryLayerId);
        // @ts-ignore
        expect(geometryFillLayer.paint['fill-opacity']).toBe(0.6);

        await moveBeforeLayer(page, 'lowestRoadLine');
        await waitForMapIdle(page);
        let layers = await getAllLayers(page);
        const findGeometriesLayerIndex = () => layers.findIndex((layer) => layer.id === firstGeometryLayerId);
        let geometriesLayerIndex = findGeometriesLayerIndex();
        expect(geometriesLayerIndex).toBeGreaterThan(0);
        const lowestRoadLineIndex = layers.findIndex((layer) => layer.id === mapStyleLayerIDs.lowestRoadLine);
        expect(geometriesLayerIndex).toBeLessThan(lowestRoadLineIndex);

        await moveBeforeLayer(page, 'lowestBuilding');
        await waitForMapIdle(page);
        layers = await getAllLayers(page);
        geometriesLayerIndex = findGeometriesLayerIndex();
        expect(geometriesLayerIndex).toBeGreaterThan(0);
        let lowestBuildingIndex = layers.findIndex((layer) => layer.id === mapStyleLayerIDs.lowestBuilding);
        expect(geometriesLayerIndex).toBeLessThan(lowestBuildingIndex);

        // changing map style and verifying again:
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        // Extra defensive wait since there might be a brief idle moment between changing style and restoring geometries:
        await waitForTimeout(1000);
        layers = await getAllLayers(page);
        geometriesLayerIndex = findGeometriesLayerIndex();
        expect(geometriesLayerIndex).toBeGreaterThan(0);
        lowestBuildingIndex = layers.findIndex((layer) => layer.id === mapStyleLayerIDs.lowestBuilding);
        expect(geometriesLayerIndex).toBeLessThan(lowestBuildingIndex);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
