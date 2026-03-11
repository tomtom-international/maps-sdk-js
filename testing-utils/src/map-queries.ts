import type { Page } from '@playwright/test';
import type { Position } from 'geojson';
import type { LayerSpecWithSource } from 'map';
import type { LngLatLike, LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import type { EvalGlobalThis } from './eval/types';
import { tryBeforeTimeout, waitForTimeout } from './async-utils';

// ---------------------------------------------------------------------------
// Map idle
// ---------------------------------------------------------------------------

export const waitForMapIdle = async (page: Page): Promise<void> => {
    await page.evaluate(async () => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        if (map.loaded() && (typeof map.areTilesLoaded !== 'function' || map.areTilesLoaded())) {
            return;
        }
        await new Promise<void>((resolve) => {
            map.once('idle', () => resolve());
        });
    });
};

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export const getLayersBySource = async (page: Page, sourceId: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceId) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        return map
            .getStyle()
            .layers.filter((layer) => (layer as LayerSpecWithSource).source === pageSourceId) as LayerSpecWithSource[];
    }, sourceId);

export const getNumLayersBySource = async (page: Page, sourceId: string): Promise<number> =>
    (await getLayersBySource(page, sourceId)).length;

export const getVisibleLayersBySource = async (page: Page, sourceId: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceId) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        return map
            .getStyle()
            .layers.filter(
                (layer) =>
                    (layer as LayerSpecWithSource).source === pageSourceId && layer.layout?.visibility !== 'none',
            ) as LayerSpecWithSource[];
    }, sourceId);

export const getNumVisibleLayersBySource = async (page: Page, sourceId: string): Promise<number> =>
    (await getVisibleLayersBySource(page, sourceId)).length;

export const getLayerById = async (page: Page, layerId: string): Promise<LayerSpecWithSource> =>
    page.evaluate(
        (pageLayerId) =>
            (globalThis as EvalGlobalThis).mapLibreMap
                ?.getStyle()
                .layers.find((layer) => layer.id === pageLayerId) as LayerSpecWithSource,
        layerId,
    );

export const getLayersByIds = async (page: Page, layerIds: string[]): Promise<LayerSpecWithSource[]> =>
    page.evaluate(
        (pageLayerIds) =>
            (globalThis as EvalGlobalThis).mapLibreMap
                ?.getStyle()
                .layers.filter((layer) => pageLayerIds.includes(layer.id)) as LayerSpecWithSource[],
        layerIds,
    );

export const getLayerByID = async (page: Page, layerId: string): Promise<LayerSpecification> =>
    page.evaluate((symbolLayerId) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        return map.getStyle().layers.find((layer) => layer.id === symbolLayerId) as LayerSpecification;
    }, layerId);

export const isLayerVisible = async (page: Page, layerId: string): Promise<boolean> =>
    page.evaluate(
        (inputLayerId) =>
            (globalThis as EvalGlobalThis).mapLibreMap?.getLayoutProperty(inputLayerId, 'visibility') !== 'none',
        layerId,
    );

// ---------------------------------------------------------------------------
// Paint
// ---------------------------------------------------------------------------

export const getPaintProperty = async (page: Page, layerId: string, propertyName: string): Promise<unknown> =>
    page.evaluate(
        ({ layerID, propertyName: prop }) =>
            (globalThis as EvalGlobalThis).mapLibreMap?.getPaintProperty(layerID, prop),
        { layerID: layerId, propertyName },
    );

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export const queryRenderedFeatures = async (
    page: Page,
    layerIDs: string[],
    lngLat?: Position,
): Promise<MapGeoJSONFeature[]> =>
    page.evaluate(
        ({ inputLayerIDs, inputLngLat }) => {
            const map = (globalThis as EvalGlobalThis).mapLibreMap;
            if (!map) {
                throw new Error('globalThis.mapLibreMap is not available.');
            }
            const options = { layers: inputLayerIDs, validate: false };
            if (inputLngLat) {
                return map.queryRenderedFeatures(map.project(inputLngLat as [number, number]), options);
            }
            return map.queryRenderedFeatures(options);
        },
        { inputLayerIDs: layerIDs, inputLngLat: lngLat },
    );

export const waitUntilRenderedFeatures = async (
    page: Page,
    layerIDs: string[],
    expectNumFeatures: number,
    timeoutMs: number,
    lngLat?: Position,
): Promise<MapGeoJSONFeature[]> =>
    tryBeforeTimeout(
        async () => {
            let currentFeatures: MapGeoJSONFeature[] = [];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(page, layerIDs, lngLat);
            } while (currentFeatures.length !== expectNumFeatures);
            return currentFeatures;
        },
        `Features didn't match ${expectNumFeatures} count for layers: ${layerIDs}.`,
        timeoutMs,
    );

export const waitUntilRenderedFeaturesChange = async (
    page: Page,
    layerIDs: string[],
    previousNumFeatures: number,
    timeoutMs: number,
    lngLat?: Position,
): Promise<MapGeoJSONFeature[]> =>
    tryBeforeTimeout(
        async () => {
            let currentFeatures: MapGeoJSONFeature[] = [];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(page, layerIDs, lngLat);
            } while (currentFeatures.length === previousNumFeatures);
            return currentFeatures;
        },
        `Features didn't change from ${previousNumFeatures} for layers: ${layerIDs}.`,
        timeoutMs,
    );

export const getPixelCoords = async (
    page: Page,
    coordinates: [number, number] | Position,
): Promise<{ x: number; y: number }> =>
    page.evaluate((inputCoordinates) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        const point = map.project(inputCoordinates as [number, number]);
        return { x: point.x, y: point.y };
    }, coordinates);

export const getCursor = async (page: Page): Promise<string> =>
    page.evaluate(() => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        return map.getCanvas().style.cursor;
    });

export const moveAndZoomTo = async (page: Page, viewport: { center: LngLatLike; zoom: number }): Promise<void> => {
    await page.evaluate(({ center, zoom }) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        map.jumpTo({ center, zoom });
    }, viewport);
};

export const zoomTo = async (page: Page, zoom: number): Promise<void> => {
    await page.evaluate((inputZoom) => {
        const map = (globalThis as EvalGlobalThis).mapLibreMap;
        if (!map) {
            throw new Error('globalThis.mapLibreMap is not available.');
        }
        map.zoomTo(inputZoom);
    }, zoom);
};
