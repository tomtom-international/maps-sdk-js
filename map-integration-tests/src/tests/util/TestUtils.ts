import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
    getLayersByIds,
    getNumVisibleLayersBySource,
    queryRenderedFeatures,
    tryBeforeTimeout,
} from '@testing/core-utils';
import type { GlobalConfig, Language, Place, Places, PolygonFeatures, Routes, WaypointLike, Waypoints } from 'core';
import type {
    BaseMapLayerGroups,
    BaseMapModuleConfig,
    EventHandlerConfig,
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
    SetStyleOptions,
    SourceWithLayerIDs,
    StyleInput,
    TrafficAreaAnalyticsConfig,
    TrafficIncidentOverlayConfig,
    WaypointDisplayProps,
} from 'map';
import { poiLayerIDs } from 'map';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { MapsSDKThis } from '../types/MapsSDKThis';

export {
    getCursor,
    getLayerById,
    getLayerIndex,
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
} from '@testing/core-utils';

export const waitForMapReady = async (page: Page) =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const mapsSdkThis = globalThis as MapsSDKThis;
                    // Poll `tomtomMap.mapReady` directly. The previous implementation resolved
                    // on the first `styledata` event without re-checking — but `styledata` fires
                    // repeatedly during a style load, and the first one fires before MapLibre
                    // has applied the full diff (and well before the SDK's `handleStyleData`
                    // sets `mapReady = true`).
                    const check = () => {
                        if (mapsSdkThis.tomtomMap.mapReady) resolve(true);
                        else setTimeout(check, 50);
                    };
                    check();
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
        mapsSdkThis.places = await mapsSdkThis.MapsSDK.PlacesModule.create(mapsSdkThis.tomtomMap, inputConfig);
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
            ((globalThis as MapsSDKThis).geometries = await (globalThis as MapsSDKThis).MapsSDK.GeometriesModule.create(
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

export const initBasemap = async (page: Page, config?: BaseMapModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.baseMap = await mapsSdkThis.MapsSDK.BaseMapModule.get(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

/**
 * Narrows the base map's events to a set of layer groups, storing the scope as `baseMapScope` or
 * `baseMapScope2`. Two scopes replace what used to need two module instances.
 */
export const initBasemapScope = async (
    page: Page,
    which: 'baseMapScope' | 'baseMapScope2',
    layerGroups: BaseMapLayerGroups,
    config?: EventHandlerConfig,
) =>
    page.evaluate(
        async ({ target, groups, eventConfig }) => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            // The base map is shared per map, so this is the same instance every time.
            const baseMap = await mapsSdkThis.MapsSDK.BaseMapModule.get(mapsSdkThis.tomtomMap);
            mapsSdkThis.baseMap = baseMap;
            mapsSdkThis[target] = baseMap.events.where({ layerGroups: groups }, eventConfig);
        },
        { target: which, groups: layerGroups, eventConfig: config },
    );

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

export const initTrafficAreaAnalytics = async (page: Page, config?: TrafficAreaAnalyticsConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficAreaAnalytics = await mapsSdkThis.MapsSDK.TrafficAreaAnalyticsModule.create(
            mapsSdkThis.tomtomMap,
            inputConfig,
        );
    }, config);

export const showTrafficAreaAnalytics = async (page: Page, analytics: unknown) =>
    page.evaluate(
        (inputAnalytics) => (globalThis as MapsSDKThis).trafficAreaAnalytics?.show(inputAnalytics as any),
        analytics,
    );

export const clearTrafficAreaAnalytics = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).trafficAreaAnalytics?.clear());

export const initTrafficIncidentOverlay = async (page: Page, config?: TrafficIncidentOverlayConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficIncidentOverlay = await mapsSdkThis.MapsSDK.TrafficIncidentOverlayModule.create(
            mapsSdkThis.tomtomMap,
            inputConfig,
        );
    }, config);

export const showTrafficIncidentOverlay = async (page: Page, result: unknown) =>
    page.evaluate(
        (inputResult) => (globalThis as MapsSDKThis).trafficIncidentOverlay?.show(inputResult as any),
        result,
    );

export const clearTrafficIncidentOverlay = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidentOverlay?.clear());

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

export const setStyle = async (page: Page, style: StyleInput, options?: SetStyleOptions) =>
    // @ts-ignore
    page.evaluate(
        async ({ pageStyleInput, pageOptions }) => {
            // Awaited: setStyle resolves once the new style has loaded and every module has restored
            // itself onto it, so a test that awaits this helper looks at the finished switch.
            await (globalThis as MapsSDKThis).tomtomMap.setStyle(pageStyleInput, pageOptions);
        },
        { pageStyleInput: style, pageOptions: options },
    );

// Fires every style at the map in one synchronous burst, the way an impatient style switcher does,
// and resolves once all of the calls have settled. Only the last one should reach the network.
export const setStylesInOneBurst = async (page: Page, styles: StyleInput[]) =>
    // @ts-ignore
    page.evaluate(async (pageStyleInputs) => {
        const tomtomMap = (globalThis as MapsSDKThis).tomtomMap;
        await Promise.all(pageStyleInputs.map((pageStyleInput) => tomtomMap.setStyle(pageStyleInput)));
    }, styles);

// Fires every style at the map with a pause in between, short enough that a switch is still loading
// when the next one arrives, so the style loads overlap instead of following one another.
export const setStylesOverlapping = async (page: Page, styles: StyleInput[], delayMs: number) =>
    // @ts-ignore
    page.evaluate(
        async ({ pageStyleInputs, pageDelayMs }) => {
            const tomtomMap = (globalThis as MapsSDKThis).tomtomMap;
            const pending = [];
            for (const pageStyleInput of pageStyleInputs) {
                pending.push(tomtomMap.setStyle(pageStyleInput));
                await new Promise((resolve) => setTimeout(resolve, pageDelayMs));
            }
            await Promise.all(pending);
        },
        { pageStyleInputs: styles, pageDelayMs: delayMs },
    );

// Awaits a setStyle that is expected to fail and answers with the rejection message, or an empty
// string when it resolved after all.
export const setStyleExpectingFailure = async (page: Page, style: StyleInput): Promise<string> =>
    // @ts-ignore
    page.evaluate(async (pageStyleInput) => {
        try {
            await (globalThis as MapsSDKThis).tomtomMap.setStyle(pageStyleInput);
            return '';
        } catch (error) {
            return (error as Error).message;
        }
    }, style);

export const isMapReady = async (page: Page): Promise<boolean> =>
    page.evaluate(() => (globalThis as MapsSDKThis).tomtomMap.mapReady);

// The `map` parameter of the standard style MapLibre is actually holding, read off the URL of the
// style's own `default` sprite. Unlike `getStyle()`, which answers from the style the SDK was asked
// for, this comes from the loaded style document, so a superseded or failed switch cannot fake it.
export const getLoadedStyleMapParameter = async (page: Page): Promise<string> =>
    page.evaluate(() => {
        // The style ships one sprite URL; once the SDK has added the pin sprite it becomes a list.
        const sprite = (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.getStyle().sprite;
        const url = Array.isArray(sprite) ? sprite.find((entry) => entry.id === 'default')?.url : sprite;
        return url ? (new URL(url).searchParams.get('map') ?? '') : '';
    });

// Starts recording the styles MapLibre applies. Unlike a record taken off the network, which shows
// which style documents arrived, this shows which of them the renderer actually put on the map, and
// in which order - the evidence that a superseded style did not land late and win.
export const recordAppliedStyles = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis._appliedStyles = [];
        // `style.load` fires once per style MapLibre applies, after the whole style is parsed, so
        // the sprite below is the one that style shipped. `styledata` would fire many times per
        // style, mid-load.
        mapsSdkThis.mapLibreMap.on('style.load', () => {
            const sprite = mapsSdkThis.mapLibreMap.getStyle().sprite;
            const url = Array.isArray(sprite) ? sprite.find((entry) => entry.id === 'default')?.url : sprite;
            mapsSdkThis._appliedStyles.push(url ? (new URL(url).searchParams.get('map') ?? '') : '');
        });
    });

export const getAppliedStyles = async (page: Page): Promise<string[]> =>
    page.evaluate(() => (globalThis as MapsSDKThis)._appliedStyles);

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
        mapsSdkThis.routing = await mapsSdkThis.MapsSDK.RoutingModule.create(mapsSdkThis.tomtomMap, inputConfig);
    }, config);

export const initRouting2 = async (page: Page, config?: RoutingModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.routing2 = await mapsSdkThis.MapsSDK.RoutingModule.create(mapsSdkThis.tomtomMap, inputConfig);
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
