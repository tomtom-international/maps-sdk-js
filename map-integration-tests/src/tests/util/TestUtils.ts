import { GeoJsonProperties, Position } from "geojson";
import { MapGeoJSONFeature, LayerSpecification } from "maplibre-gl";
import { Geometries, GlobalConfig, Language, Place, Places } from "@anw/maps-sdk-js/core";
import {
    GeometriesModuleConfig,
    HillshadeModuleConfig,
    IncidentsConfig,
    LayerSpecWithSource,
    PlacesModuleConfig,
    POIsModuleConfig,
    StyleInput,
    StyleModuleConfig,
    StyleModuleInitConfig
} from "map";
import { MapsSDKThis } from "../types/MapsSDKThis";

export const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMSG: string, timeoutMS: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))]);

export const waitForTimeout = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapReady = async () =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const mapsSDKThis = globalThis as MapsSDKThis;
                    if (mapsSDKThis.tomtomMap.mapReady) {
                        resolve(true);
                    } else {
                        mapsSDKThis.mapLibreMap.once("styledata", () => resolve(true));
                    }
                });
            }),
        "Map style did not load",
        10000
    );

export const waitForMapIdle = async () =>
    page.evaluate(async () => (globalThis as MapsSDKThis).mapLibreMap.once("idle"));

export const getVisibleLayersBySource = async (sourceID: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter(
                (layer) => (layer as LayerSpecWithSource).source === pageSourceID && layer.layout?.visibility !== "none"
            ) as LayerSpecWithSource[];
    }, sourceID);

export const getLayerById = async (layerId: string): Promise<LayerSpecWithSource> =>
    page.evaluate((pageLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === pageLayerID)
            .shift() as LayerSpecWithSource;
    }, layerId);

export const getNumVisibleLayersBySource = async (sourceID: string): Promise<number> =>
    (await getVisibleLayersBySource(sourceID))?.length;

export const assertNumber = (value: number, positiveVsZero: boolean) => {
    if (positiveVsZero) {
        expect(value).toBeGreaterThan(0);
    } else {
        expect(value).toBe(0);
    }
};

export const queryRenderedFeatures = async (layerIDs: string[], lngLat?: Position): Promise<MapGeoJSONFeature[]> =>
    page.evaluate(
        (inputLayerIDs, inputLngLat) => {
            const mapLibreMap = (globalThis as MapsSDKThis).mapLibreMap;
            return mapLibreMap.queryRenderedFeatures(
                inputLngLat && mapLibreMap.project(inputLngLat as [number, number]),
                {
                    layers: inputLayerIDs
                }
            );
        },
        layerIDs,
        lngLat
    );

export const waitUntilRenderedFeatures = async (
    layerIDs: string[],
    expectNumFeatures: number,
    timeoutMS: number,
    lngLat?: Position
): Promise<MapGeoJSONFeature[]> =>
    tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            let currentFeatures: MapGeoJSONFeature[] = [];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(layerIDs, lngLat);
            } while (currentFeatures.length != expectNumFeatures);
            return currentFeatures;
        },
        `Features didn't match ${expectNumFeatures} count for layers: ${layerIDs}.`,
        timeoutMS
    );

export const waitUntilRenderedFeaturesChange = async (
    layerIDs: string[],
    previousNumFeatures: number,
    timeoutMS: number,
    lngLat?: Position
): Promise<MapGeoJSONFeature[]> =>
    tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            let currentFeatures: MapGeoJSONFeature[];
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(layerIDs, lngLat);
            } while (currentFeatures.length == previousNumFeatures);
            return currentFeatures;
        },
        `Features didn't change from ${previousNumFeatures} for layers: ${layerIDs}.`,
        timeoutMS
    );

export const getLayerByID = async (layerID: string): Promise<LayerSpecification> =>
    page.evaluate((symbolLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === symbolLayerID)[0];
    }, layerID);

export const isLayerVisible = async (layerID: string): Promise<boolean> =>
    page.evaluate((inputLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap.getLayoutProperty(inputLayerID, "visibility") !== "none";
    }, layerID);

export const getPlacesSourceAndLayerIDs = async (): Promise<{ sourceID: string; layerIDs: string[] }> =>
    page.evaluate(() => {
        const places = (globalThis as MapsSDKThis).places;
        return {
            sourceID: places?.sourceAndLayerIDs.places.sourceID as string,
            layerIDs: places?.sourceAndLayerIDs.places.layerIDs as string[]
        };
    });

export const getGeometriesSourceAndLayerIDs = async () =>
    page.evaluate(() => (globalThis as MapsSDKThis).geometries?.sourceAndLayerIDs);

export const initPlaces = async (config?: PlacesModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places = await mapsSDKThis.MapsSDK.PlacesModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const showPlaces = async (places: Place | Place[] | Places) =>
    page.evaluate((inputPlaces) => {
        (globalThis as MapsSDKThis).places?.show(inputPlaces);
    }, places);

export const initGeometry = async (config?: GeometriesModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.geometries = await mapsSDKThis.MapsSDK.GeometriesModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const showGeometry = async (geometry: Geometries<GeoJsonProperties>) =>
    page.evaluate(
        (inputGeometry: Geometries<GeoJsonProperties>) => (globalThis as MapsSDKThis).geometries?.show(inputGeometry),
        geometry
    );

export const initBasemap = async (config?: StyleModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.basemap = await mapsSDKThis.MapsSDK.BaseMapModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const initTrafficIncidents = async (config?: StyleModuleInitConfig & IncidentsConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.trafficIncidents = await mapsSDKThis.MapsSDK.TrafficIncidentsModule.get(
            mapsSDKThis.tomtomMap,
            inputConfig
        );
    }, config);

export const initPOIs = async (config?: StyleModuleInitConfig & POIsModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const initHillshade = async (config?: StyleModuleInitConfig & HillshadeModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.hillshade = await mapsSDKThis.MapsSDK.HillshadeModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

export const setStyle = async (style: StyleInput) =>
    page.evaluate((pageStyleInput) => {
        (globalThis as MapsSDKThis).tomtomMap.setStyle(pageStyleInput);
    }, style);

export const setLanguage = async (language: Language) =>
    page.evaluate((inputLanguage) => {
        (globalThis as MapsSDKThis).tomtomMap.setLanguage(inputLanguage);
    }, language);

export const putGlobalConfig = async (config: Partial<GlobalConfig>) =>
    page.evaluate((inputConfig) => {
        (globalThis as MapsSDKThis).MapsSDKCore.TomTomConfig.instance.put(inputConfig);
    }, config);
