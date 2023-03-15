import { GeoJsonProperties, Position } from "geojson";
import { MapGeoJSONFeature, SymbolLayerSpecification } from "maplibre-gl";
import { Geometries, Places } from "@anw/maps-sdk-js/core";
import {
    GeometryModuleConfig,
    LayerSpecWithSource,
    PlaceModuleConfig,
    StyleInput,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
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

export const getNumVisibleLayersBySource = async (sourceID: string): Promise<number> =>
    (await getVisibleLayersBySource(sourceID))?.length;

export const assertNumber = (value: number, positiveVsZero: boolean) => {
    if (positiveVsZero) {
        expect(value).toBeGreaterThan(0);
    } else {
        expect(value).toBe(0);
    }
};

export const assertTrafficVisibility = async (visibility: {
    incidents: boolean;
    incidentIcons: boolean;
    flow: boolean;
}) => {
    expect(await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.anyIncidentLayersVisible())).toBe(
        visibility.incidents
    );
    expect(await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.anyIncidentIconLayersVisible())).toBe(
        visibility.incidentIcons
    );
    expect(await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.anyFlowLayersVisible())).toBe(
        visibility.flow
    );
    if (visibility.incidents && visibility.flow) {
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.anyLayersVisible())).toBe(true);
    } else if (!visibility.incidents && !visibility.flow) {
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).traffic?.anyLayersVisible())).toBe(false);
    }

    // we double-check against maplibre directly as well:
    assertNumber(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID), visibility.incidents);
    assertNumber(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID), visibility.flow);
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
        // @ts-ignore
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

export const getSymbolLayersByID = async (layerID: string): Promise<SymbolLayerSpecification> =>
    page.evaluate((symbolLayerID) => {
        return (globalThis as MapsSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === symbolLayerID)[0] as SymbolLayerSpecification;
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

export const initPlaces = async (config?: PlaceModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places = await mapsSDKThis.MapsSDK.GeoJSONPlaces.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config as never);

export const showPlaces = async (places: Places) =>
    page.evaluate((inputPlaces: Places) => {
        (globalThis as MapsSDKThis).places?.show(inputPlaces);
        // @ts-ignore
    }, places);

export const initGeometry = async (config?: GeometryModuleConfig) =>
    page.evaluate(
        async (inputConfig: GeometryModuleConfig) => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.geometry = await mapsSDKThis.MapsSDK.GeometryModule.init(mapsSDKThis.tomtomMap, inputConfig);
        },
        // @ts-ignore
        config
    );

export const showGeometry = async (geometry: Geometries<GeoJsonProperties>) =>
    page.evaluate(
        (inputGeometry: Geometries<GeoJsonProperties>) => (globalThis as MapsSDKThis).geometry?.show(inputGeometry),
        // @ts-ignore
        geometry
    );

export const setStyle = async (style: StyleInput) =>
    page.evaluate((pageStyleInput) => {
        (globalThis as MapsSDKThis).tomtomMap.setStyle(pageStyleInput);
    }, style as any);
