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
    StyleModuleInitConfig,
} from 'map';
import { poiLayerIDs } from 'map/src/pois';
import type { WaypointDisplayProps } from 'map/src/routing';
import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import type { MapsSDKThis } from '../types/MapsSDKThis';

export const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMSG: string, timeoutMS: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))]);

export const waitForTimeout = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapReady = async (page: Page) =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const mapsSDKThis = globalThis as MapsSDKThis;
                    if (mapsSDKThis.tomtomMap.mapReady) {
                        resolve(true);
                    } else {
                        mapsSDKThis.mapLibreMap.once('styledata', () => resolve(true));
                    }
                });
            }),
        'Map style did not load',
        10000,
    );

export const waitForMapIdle = async (page: Page) =>
    page.evaluateHandle(async () => (globalThis as MapsSDKThis).mapLibreMap.once('idle'));

export const getLayersBySource = async (page: Page, sourceID: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => (layer as LayerSpecWithSource).source === pageSourceID) as LayerSpecWithSource[];
    }, sourceID);

export const getNumLayersBySource = async (page: Page, sourceID: string): Promise<number> =>
    (await getLayersBySource(page, sourceID))?.length;

export const getVisibleLayersBySource = async (page: Page, sourceID: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter(
                (layer) =>
                    (layer as LayerSpecWithSource).source === pageSourceID && layer.layout?.visibility !== 'none',
            ) as LayerSpecWithSource[];
    }, sourceID);

export const getLayerById = async (page: Page, layerId: string): Promise<LayerSpecWithSource> =>
    page.evaluate(
        (pageLayerID) =>
            (globalThis as MapsSDKThis).mapLibreMap
                .getStyle()
                .layers.filter((layer) => layer.id === pageLayerID)
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

export const getPaintProperty = async (page: Page, layerID: string, propertyName: string) =>
    page.evaluate(
        ({ layerID, propertyName }) => (globalThis as MapsSDKThis).mapLibreMap.getPaintProperty(layerID, propertyName),
        { layerID, propertyName },
    );

export const getNumVisibleLayersBySource = async (page: Page, sourceID: string): Promise<number> =>
    (await getVisibleLayersBySource(page, sourceID))?.length;

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
    timeoutMS: number,
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
        timeoutMS,
    );

export const waitUntilRenderedFeaturesChange = async (
    page: Page,
    layerIDs: string[],
    previousNumFeatures: number,
    timeoutMS: number,
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
        timeoutMS,
    );

export const getLayerByID = async (page: Page, layerID: string): Promise<LayerSpecification> =>
    page.evaluate((symbolLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === symbolLayerID)[0];
    }, layerID);

export const isLayerVisible = async (page: Page, layerID: string): Promise<boolean> =>
    page.evaluate((inputLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap.getLayoutProperty(inputLayerID, 'visibility') !== 'none';
    }, layerID);

export const getPOILayers = async (page: Page) => getLayersByIds(page, poiLayerIDs);

export const getVisiblePOILayers = async (page: Page) =>
    (await getPOILayers(page)).filter((layer) => layer.layout?.visibility !== 'none');

export const getNumVisiblePOILayers = async (page: Page) => (await getVisiblePOILayers(page)).length;

export const getPlacesSourceAndLayerIDs = async (page: Page): Promise<SourceWithLayerIDs> =>
    page.evaluate(() => (globalThis as MapsSDKThis).places!.sourceAndLayerIDs.places);

export const getGeometriesSourceAndLayerIDs = async (page: Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).geometries?.sourceAndLayerIDs);

export const initPlaces = async (page: Page, config?: PlacesModuleConfig) =>
    // @ts-ignore
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places = await mapsSDKThis.MapsSDK.PlacesModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const showPlaces = async (page: Page, places: Place | Place[] | Places) =>
    page.evaluate((inputPlaces) => {
        (globalThis as MapsSDKThis).places?.show(inputPlaces);
    }, places);

export const clearPlaces = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).places?.clear());

export const initGeometries = async (page: Page, config?: GeometriesModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.geometries = await mapsSDKThis.MapsSDK.GeometriesModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const showGeometry = async (page: Page, geometry: PolygonFeatures) =>
    page.evaluate(
        (inputGeometry: PolygonFeatures) => (globalThis as MapsSDKThis).geometries?.show(inputGeometry),
        geometry,
    );

export const initBasemap = async (page: Page, config?: BaseMapModuleInitConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.baseMap = await mapsSDKThis.MapsSDK.BaseMapModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const initBasemap2 = async (page: Page, config?: BaseMapModuleInitConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.baseMap2 = await mapsSDKThis.MapsSDK.BaseMapModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const initTrafficIncidents = async (page: Page, config?: StyleModuleInitConfig & IncidentsConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.trafficIncidents = await mapsSDKThis.MapsSDK.TrafficIncidentsModule.get(
            mapsSDKThis.tomtomMap,
            inputConfig,
        );
    }, config);

export const initPOIs = async (page: Page, config?: POIsModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const initHillshade = async (page: Page, config?: StyleModuleInitConfig & HillshadeModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.hillshade = await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, inputConfig);
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
    page.evaluate(async (inputConfig?: RoutingModuleConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing = await mapsSDKThis.MapsSDK.RoutingModule.init(mapsSDKThis.tomtomMap, inputConfig);
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
        const mapsSDKThis = globalThis as MapsSDKThis;
        return mapsSDKThis.tomtomMap.mapLibreMap.getCanvas().style.cursor;
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
    featureID?: string,
): Promise<EventType | undefined> =>
    new Promise<EventType | undefined>((resolve, reject) => {
        let eventState;
        const intervalMS = 200;
        const maxTries = 5000 / intervalMS;
        let tries = 0;
        const interval = setInterval(async () => {
            const features = await queryRenderedFeatures(page, layerIDs);
            const feature = featureID ? features.find((feature) => feature.id === featureID) : features[0];
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
        }, intervalMS);
    });

export const getHoveredTopFeature = async <T>(page: Page): Promise<T> =>
    page.evaluate(() => (globalThis as MapsSDKThis)._hoveredTopFeature as T);

export const getClickedTopFeature = async <T = MapGeoJSONFeature>(page: Page): Promise<T> =>
    page.evaluate(() => (globalThis as MapsSDKThis)._clickedTopFeature as T);

export const zoomTo = async (page: Page, zoom: number) =>
    page.evaluateHandle((zoom) => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.zoomTo(zoom), zoom);
