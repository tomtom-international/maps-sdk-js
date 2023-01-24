import { GOSDKMapParams, LayerSpecWithSource, MapLibreOptions } from "map";
import { GOSDKThis } from "../types/GOSDKThis";
import { MapGeoJSONFeature, SymbolLayerSpecification } from "maplibre-gl";
import { Position } from "geojson";

const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMSG: string, timeoutMS: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))]);

export const waitForTimeout = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapStyleToLoad = async () =>
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

export const waitForAnyRenderedFeatures = async (
    layerIDs: string[],
    timeoutMS: number,
    lngLat?: Position
): Promise<MapGeoJSONFeature[]> => {
    let currentFeatures: MapGeoJSONFeature[] = [];
    return tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            while (currentFeatures.length == 0) {
                await waitForTimeout(500);
                currentFeatures = await queryRenderedFeatures(layerIDs, lngLat);
            }
            return currentFeatures;
        },
        `Did not get any features for layers ${layerIDs}.`,
        timeoutMS
    );
};

export class MapIntegrationTestEnv {
    consoleErrors: unknown[] = [];

    async loadPage() {
        await page.goto("https://localhost:9001");
        page.on("console", (message) => message.type() === "error" && this.consoleErrors.push(message));
    }

    async loadMap(mapLibreOptions: Partial<MapLibreOptions>, goSDKParams?: GOSDKMapParams) {
        this.consoleErrors = [];
        return page.evaluate(
            (pageMapLibreOptions, pageGOSDKParams, pageAPIKey) => {
                document.querySelector("canvas")?.remove();
                const goSDKThis = globalThis as GOSDKThis;
                goSDKThis.goSDKMap = new goSDKThis.GOSDK.GOSDKMap(
                    { ...pageMapLibreOptions, container: document.getElementById("map") },
                    { ...pageGOSDKParams, apiKey: pageAPIKey }
                );
                goSDKThis.mapLibreMap = goSDKThis.goSDKMap.mapLibreMap;
            },
            // @ts-ignore
            mapLibreOptions,
            goSDKParams,
            process.env.API_KEY
        );
    }
}

export const getSymbolLayersByID = async (layerID: string): Promise<SymbolLayerSpecification> => {
    return page.evaluate((symbolLayerID) => {
        return (globalThis as GOSDKThis).mapLibreMap
            .getStyle()
            .layers.filter((layer) => layer.id === symbolLayerID)[0] as SymbolLayerSpecification;
    }, layerID);
};

export const isLayerVisible = async (layerID: string): Promise<boolean> =>
    page.evaluate((inputLayerID) => {
        return (globalThis as GOSDKThis).mapLibreMap.getLayoutProperty(inputLayerID, "visibility") !== "none";
    }, layerID);
