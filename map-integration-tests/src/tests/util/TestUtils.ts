import { GOSDKThis } from "../types/GOSDKThis";
import { MapGeoJSONFeature, SymbolLayerSpecification } from "maplibre-gl";
import { LayerSpecWithSource, VECTOR_TILES_FLOW_SOURCE_ID, VECTOR_TILES_INCIDENTS_SOURCE_ID } from "map";
import { Position } from "geojson";

const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMSG: string, timeoutMS: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))]);

export const waitForTimeout = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapReady = async () =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const goSDKThis = globalThis as GOSDKThis;
                    if (goSDKThis.goSDKMap.mapReady) {
                        resolve(true);
                    } else {
                        goSDKThis.mapLibreMap.once("styledata", () => resolve(true));
                    }
                });
            }),
        "Map style did not load",
        10000
    );

export const waitForMapIdle = async () => page.evaluate(async () => (globalThis as GOSDKThis).mapLibreMap.once("idle"));

export const getVisibleLayersBySource = async (sourceID: string): Promise<LayerSpecWithSource[]> =>
    page.evaluate((pageSourceID) => {
        return (globalThis as GOSDKThis).mapLibreMap
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
    expect(await page.evaluate(() => (globalThis as GOSDKThis).traffic?.anyIncidentLayersVisible())).toBe(
        visibility.incidents
    );
    expect(await page.evaluate(() => (globalThis as GOSDKThis).traffic?.anyIncidentIconLayersVisible())).toBe(
        visibility.incidentIcons
    );
    expect(await page.evaluate(() => (globalThis as GOSDKThis).traffic?.anyFlowLayersVisible())).toBe(visibility.flow);
    if (visibility.incidents && visibility.flow) {
        expect(await page.evaluate(() => (globalThis as GOSDKThis).traffic?.anyLayersVisible())).toBe(true);
    } else if (!visibility.incidents && !visibility.flow) {
        expect(await page.evaluate(() => (globalThis as GOSDKThis).traffic?.anyLayersVisible())).toBe(false);
    }

    // we double-check against maplibre directly as well:
    assertNumber(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID), visibility.incidents);
    assertNumber(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID), visibility.flow);
};

export const queryRenderedFeatures = async (layerIDs: string[], lngLat?: Position): Promise<MapGeoJSONFeature[]> =>
    page.evaluate(
        (inputLayerIDs, inputLngLat) => {
            const mapLibreMap = (globalThis as GOSDKThis).mapLibreMap;
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
): Promise<MapGeoJSONFeature[]> => {
    let currentFeatures: MapGeoJSONFeature[] = [];
    return tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            while (currentFeatures.length !== expectNumFeatures) {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(layerIDs, lngLat);
            }
            return currentFeatures;
        },
        `Did not get the expected map features for layers ${layerIDs}. 
        Expected is ${expectNumFeatures} but got ${currentFeatures.length}`,
        timeoutMS
    );
};

export const waitUntilRenderedFeaturesChange = async (
    layerIDs: string[],
    previousNumFeatures: number,
    timeoutMS: number,
    lngLat?: Position
): Promise<MapGeoJSONFeature[]> => {
    let currentFeatures: MapGeoJSONFeature[];
    return tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            do {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(layerIDs, lngLat);
            } while (currentFeatures.length == previousNumFeatures);
            return currentFeatures;
        },
        `Features didn't change for layers: ${layerIDs}.`,
        timeoutMS
    );
};

export const getSymbolLayersByID = async (layerID: string): Promise<SymbolLayerSpecification> =>
    page.evaluate((symbolLayerID) => {
        return (globalThis as GOSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === symbolLayerID)[0] as SymbolLayerSpecification;
    }, layerID);

export const isLayerVisible = async (layerID: string): Promise<boolean> =>
    page.evaluate((inputLayerID) => {
        return (globalThis as GOSDKThis).mapLibreMap.getLayoutProperty(inputLayerID, "visibility") !== "none";
    }, layerID);
