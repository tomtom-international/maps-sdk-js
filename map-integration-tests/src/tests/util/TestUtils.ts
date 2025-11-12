import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { GlobalConfig, Language, Place, Places, PolygonFeatures, WaypointLike, Waypoints } from 'core';
import type { Position } from 'geojson';
import type {
    BaseMapModuleInitConfig,
    EventType,
    GeometriesModuleConfig,
    HillshadeModuleConfig,
    IncidentsConfig,
    LayerSpecWithSource,
    PlacesModuleConfig,
    POIsModuleConfig,
    RoutingModuleConfig,
    SourceWithLayerIDs,
    StyleInput,
    WaypointDisplayProps,
} from 'map';
import { poiLayerIDs } from 'map';
import { LayerSpecification, LngLatLike, MapGeoJSONFeature } from 'maplibre-gl';
import { MapsSDKThis } from '../types/MapsSDKThis';

export const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMsg: string, timeoutMs: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))]);

export const waitForTimeout = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapReady = async (page: Page) =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const mapsSdkThis = globalThis as MapsSDKThis;
                    if (mapsSdkThis.tomtomMap.mapReady) {
                        resolve(true);
                    } else {
                        mapsSdkThis.mapLibreMap.once('styledata', () => resolve(true));
                    }
                });
            }),
        'Map style did not load',
        10000,
    );

export const waitForMapIdle = async (page: Page) =>
    page.evaluateHandle(async () => (globalThis as MapsSDKThis).mapLibreMap.once('idle'));

export const getLayersBySource = async (page: Page, sourceId: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceId) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => (layer as LayerSpecWithSource).source === pageSourceId) as LayerSpecWithSource[];
    }, sourceId);

export const getNumLayersBySource = async (page: Page, sourceId: string): Promise<number> =>
    (await getLayersBySource(page, sourceId))?.length;

export const getVisibleLayersBySource = async (page: Page, sourceId: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceId) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter(
                (layer) =>
                    (layer as LayerSpecWithSource).source === pageSourceId && layer.layout?.visibility !== 'none',
            ) as LayerSpecWithSource[];
    }, sourceId);

export const getLayerById = async (page: Page, layerId: string): Promise<LayerSpecWithSource> =>
    page.evaluate(
        (pageLayerId) =>
            (globalThis as MapsSDKThis).mapLibreMap
                .getStyle()
                .layers.filter((layer) => layer.id === pageLayerId)
                .shift() as LayerSpecWithSource,
        layerId,
    );

export const getLayersByIds = async (page: Page, layerIds: string[]): Promise<LayerSpecWithSource[]> =>
    page.evaluate(
        (pageLayerIDs) =>
            (globalThis as MapsSDKThis).mapLibreMap
                .getStyle()
                .layers.filter((layer) => pageLayerIDs.includes(layer.id)) as LayerSpecWithSource[],
        layerIds,
    );

export const getPaintProperty = async (page: Page, layerId: string, propertyName: string) =>
    page.evaluate(
        ({ layerID, propertyName }) => (globalThis as MapsSDKThis).mapLibreMap.getPaintProperty(layerID, propertyName),
        {
            layerID: layerId,
            propertyName,
        },
    );

export const getNumVisibleLayersBySource = async (page: Page, sourceId: string): Promise<number> =>
    (await getVisibleLayersBySource(page, sourceId))?.length;

export const assertNumber = (value: number, positiveVsZero: boolean) => {
    if (positiveVsZero) {
        expect(value).toBeGreaterThan(0);
    } else {
        expect(value).toBe(0);
    }
};

export const queryRenderedFeatures = async (
    page: Page,
    layerIDs: string[],
    lngLat?: Position,
): Promise<MapGeoJSONFeature[]> =>
    page.evaluate(
        ({ layerIDs, lngLat }) => {
            const mapLibreMap = (globalThis as MapsSDKThis).mapLibreMap;
            const options = { layers: layerIDs };
            if (lngLat) {
                return mapLibreMap.queryRenderedFeatures(mapLibreMap.project(lngLat as [number, number]), options);
            }
            return mapLibreMap.queryRenderedFeatures(options);
        },
        { layerIDs, lngLat },
    );

export const waitUntilRenderedFeatures = async (
    page: Page,
    layerIDs: string[],
    expectNumFeatures: number,
    timeoutMs: number,
    lngLat?: Position,
): Promise<MapGeoJSONFeature[]> =>
    tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            let currentFeatures: MapGeoJSONFeature[] = [];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(page, layerIDs, lngLat);
            } while (currentFeatures.length != expectNumFeatures);
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
        async (): Promise<MapGeoJSONFeature[]> => {
            let currentFeatures: MapGeoJSONFeature[];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(page, layerIDs, lngLat);
            } while (currentFeatures.length === previousNumFeatures);
            return currentFeatures;
        },
        `Features didn't change from ${previousNumFeatures} for layers: ${layerIDs}.`,
        timeoutMs,
    );

export const getLayerByID = async (page: Page, layerId: string): Promise<LayerSpecification> =>
    page.evaluate((symbolLayerId) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.find((layer) => layer.id === symbolLayerId) as LayerSpecification;
    }, layerId);

export const isLayerVisible = async (page: Page, layerId: string): Promise<boolean> =>
    page.evaluate((inputLayerId) => {
        return (globalThis as MapsSDKThis).mapLibreMap.getLayoutProperty(inputLayerId, 'visibility') !== 'none';
    }, layerId);

export const getPOILayers = async (page: Page) => getLayersByIds(page, poiLayerIDs);

export const getVisiblePOILayers = async (page: Page) =>
    (await getPOILayers(page)).filter((layer) => layer.layout?.visibility !== 'none');

export const getNumVisiblePOILayers = async (page: Page) => (await getVisiblePOILayers(page)).length;

export const getPlacesSourceAndLayerIDs = async (page: Page): Promise<SourceWithLayerIDs> =>
    page.evaluate(() => (globalThis as MapsSDKThis).places?.sourceAndLayerIDs.places as SourceWithLayerIDs);

export const getGeometriesSourceAndLayerIDs = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).geometries?.sourceAndLayerIDs);

export const initPlaces = async (page: Page, config?: PlacesModuleConfig) =>
    // @ts-ignore
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.places = await mapsSdkThis.MapsSDK.PlacesModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const showPlaces = async (page: Page, places: Place | Place[] | Places) =>
    page.evaluate((inputPlaces) => {
        (globalThis as MapsSDKThis).places?.show(inputPlaces);
    }, places);

export const clearPlaces = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).places?.clear());

export const initGeometries = async (page: Page, config?: GeometriesModuleConfig) =>
    page.evaluate(
        // @ts-ignore
        async (inputConfig) =>
            ((globalThis as MapsSDKThis).geometries = await (globalThis as MapsSDKThis).MapsSDK.GeometriesModule.get(
                (globalThis as MapsSDKThis).tomtomMap,
                inputConfig,
            )),
        config,
    );

export const showGeometry = async (page: Page, geometry: PolygonFeatures) =>
    page.evaluate(
        (inputGeometry: PolygonFeatures) => (globalThis as MapsSDKThis).geometries?.show(inputGeometry),
        geometry,
    );

export const initBasemap = async (page: Page, config?: BaseMapModuleInitConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.baseMap = await mapsSdkThis.MapsSDK.BaseMapModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const initBasemap2 = async (page: Page, config?: BaseMapModuleInitConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.baseMap2 = await mapsSdkThis.MapsSDK.BaseMapModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const initTrafficIncidents = async (page: Page, config?: IncidentsConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficIncidents = await mapsSdkThis.MapsSDK.TrafficIncidentsModule.get(
            mapsSdkThis.tomtomMap,
            inputConfig,
        );
    }, config);

export const initPOIs = async (page: Page, config?: POIsModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.pois = await mapsSdkThis.MapsSDK.POIsModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const initHillshade = async (page: Page, config?: HillshadeModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.hillshade = await mapsSdkThis.MapsSDK.HillshadeModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const setStyle = async (page: Page, style: StyleInput) =>
    // @ts-ignore
    page.evaluate((pageStyleInput) => {
        (globalThis as MapsSDKThis).tomtomMap.setStyle(pageStyleInput);
    }, style);

export const setLanguage = async (page: Page, language: Language) =>
    page.evaluate((inputLanguage) => {
        (globalThis as MapsSDKThis).tomtomMap.setLanguage(inputLanguage);
    }, language);

export const putGlobalConfig = async (page: Page, config: Partial<GlobalConfig>) =>
    page.evaluate((inputConfig) => {
        (globalThis as MapsSDKThis).MapsSDKCore.TomTomConfig.instance.put(inputConfig);
    }, config);

export const initRouting = async (page: Page, config?: RoutingModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.routing = await mapsSdkThis.MapsSDK.RoutingModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const showWaypoints = async (page: Page, waypoints: WaypointLike[]) =>
    page.evaluate((inputWaypoints) => {
        (globalThis as MapsSDKThis).routing?.showWaypoints(inputWaypoints);
    }, waypoints);

export const getWaypointLayers = async (page: Page): Promise<string[]> =>
    page.evaluate(() => (globalThis as MapsSDKThis).routing?.sourceAndLayerIDs.waypoints.layerIDs ?? []);

export const getDisplayWaypoints = async (page: Page): Promise<Waypoints<WaypointDisplayProps>> =>
    page.evaluate(
        () =>
            ((globalThis as MapsSDKThis).routing as any).sourcesWithLayers.waypoints
                .shownFeatures as Waypoints<WaypointDisplayProps>,
    );

export const getPixelCoords = async (
    page: Page,
    inputCoordinates: [number, number] | Position,
): Promise<{ x: number; y: number }> =>
    page.evaluate((coordinates) => {
        const point = (globalThis as MapsSDKThis).mapLibreMap.project(coordinates as [number, number]);
        // we ensure to return a simple serializable object:
        return { x: point.x, y: point.y };
    }, inputCoordinates);

export const getCursor = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        return mapsSdkThis.tomtomMap.mapLibreMap.getCanvas().style.cursor;
    });

export const getNumLeftAndRightClicks = async (page: Page): Promise<[number, number]> =>
    page.evaluate(() => {
        const sdkThis = globalThis as MapsSDKThis;
        return [sdkThis._numOfClicks, sdkThis._numOfContextmenuClicks] as [number, number];
    });

export const getNumHoversAndLongHovers = async (page: Page): Promise<[number, number]> =>
    page.evaluate(() => {
        const sdkThis = globalThis as MapsSDKThis;
        return [sdkThis._numOfHovers, sdkThis._numOfLongHovers] as [number, number];
    });

export const waitForEventState = async (
    page: Page,
    expectedEventState: EventType | undefined,
    layerIDs: string[],
    featureId?: string,
): Promise<EventType | undefined> =>
    new Promise<EventType | undefined>((resolve, reject) => {
        let eventState;
        const intervalMs = 200;
        const maxTries = 5000 / intervalMs;
        let tries = 0;
        const interval = setInterval(async () => {
            const features = await queryRenderedFeatures(page, layerIDs);
            const feature = featureId ? features.find((feature) => feature.id === featureId) : features[0];
            eventState = feature?.properties?.eventState;
            if (eventState === expectedEventState) {
                clearInterval(interval);
                resolve(eventState);
            }
            tries++;
            if (tries > maxTries) {
                clearInterval(interval);
                reject(new Error(`Event state didn't match ${expectedEventState}. Last read value was ${eventState}`));
            }
        }, intervalMs);
    });

export const getHoveredTopFeature = async <T>(page: Page): Promise<T> =>
    page.evaluate(() => (globalThis as MapsSDKThis)._hoveredTopFeature as T);

export const getClickedTopFeature = async <T = MapGeoJSONFeature>(page: Page): Promise<T> =>
    page.evaluate(() => (globalThis as MapsSDKThis)._clickedTopFeature as T);

export const moveAndZoomTo = async (page: Page, viewport: { center: LngLatLike; zoom: number }) =>
    page.evaluateHandle(
        ({ center, zoom }) => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.jumpTo({ center, zoom }),
        viewport,
    );

export const zoomTo = async (page: Page, zoom: number) =>
    page.evaluateHandle((zoom) => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.zoomTo(zoom), zoom);
