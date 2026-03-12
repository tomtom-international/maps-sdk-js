import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { GlobalConfig, Language, Place, Places, PolygonFeatures, Routes, WaypointLike, Waypoints } from 'core';
import type {
    BaseMapModuleInitConfig,
    EventType,
    FlowConfig,
    GeometriesModuleConfig,
    HillshadeModuleConfig,
    IncidentsConfig,
    PlaceIconConfig,
    PlacesModuleConfig,
    PlacesTheme,
    POIsModuleConfig,
    RoutingModuleConfig,
    SourceWithLayerIDs,
    StyleInput,
    WaypointDisplayProps,
} from 'map';
import { poiLayerIDs } from 'map';
import { MapGeoJSONFeature } from 'maplibre-gl';
import { getLayersByIds, getNumVisibleLayersBySource, queryRenderedFeatures, tryBeforeTimeout } from 'testing-utils';
import { MapsSDKThis } from '../types/MapsSDKThis';

export {
    getCursor,
    getLayerByID,
    getLayerById,
    getLayersByIds,
    getLayersBySource,
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    getPaintProperty,
    getPixelCoords,
    getVisibleLayersBySource,
    isLayerVisible,
    moveAndZoomTo,
    queryRenderedFeatures,
    tryBeforeTimeout,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
    waitUntilRenderedFeaturesChange,
    zoomTo,
} from 'testing-utils';

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

export const assertNumber = (value: number, positiveVsZero: boolean) => {
    if (positiveVsZero) {
        expect(value).toBeGreaterThan(0);
    } else {
        expect(value).toBe(0);
    }
};

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

export const applyPlacesTheme = async (page: Page, theme: PlacesTheme) =>
    page.evaluate(async (inputTheme) => (globalThis as MapsSDKThis).places?.applyTheme(inputTheme), theme);

export const applyPlacesIconConfig = async (page: Page, iconConfig: PlaceIconConfig) =>
    // @ts-ignore
    page.evaluate(async (inputConfig) => (globalThis as MapsSDKThis).places?.applyIconConfig(inputConfig), iconConfig);

export const getNumVisiblePlacesLayers = async (page: Page, sourceId: string) =>
    getNumVisibleLayersBySource(page, sourceId);

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

export const initTrafficFlow = async (page: Page, config?: FlowConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficFlow = await mapsSdkThis.MapsSDK.TrafficFlowModule.get(mapsSdkThis.tomtomMap, inputConfig);
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
    // @ts-ignore
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.routing = await mapsSdkThis.MapsSDK.RoutingModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const initRouting2 = async (page: Page, config?: RoutingModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.routing2 = await mapsSdkThis.MapsSDK.RoutingModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const showRoutes2 = async (page: Page, routes: Routes) =>
    page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing2?.showRoutes(inputRoutes), routes);

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
