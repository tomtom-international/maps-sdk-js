import { ConsoleMessage } from "puppeteer";
import { GOSDKMapParams, LayerSpecWithSource, MapLibreOptions } from "map";
import { GOSDKThis } from "../types/GOSDKThis";
import { MapGeoJSONFeature, SymbolLayerSpecification } from "maplibre-gl";

const tryBeforeTimeout = async <T>(func: () => Promise<T>, errorMSG: string, timeoutMS: number): Promise<T> => {
    return Promise.race<T>([
        func(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))
    ]);
};

export const waitForTimeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForMapToLoad = async () =>
    tryBeforeTimeout(
        () =>
            page.evaluate((): Promise<boolean> => {
                return new Promise((resolve) => {
                    const mapLibreMap = (globalThis as GOSDKThis).mapLibreMap;
                    if (mapLibreMap.loaded()) {
                        resolve(true);
                    } else {
                        mapLibreMap.once("load", () => resolve(true));
                    }
                });
            }),
        "Map did not load",
        30000
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

export const queryRenderedFeatures = async (layerID: string): Promise<MapGeoJSONFeature[]> =>
    page.evaluate((inputLayerID) => {
        return (globalThis as GOSDKThis).mapLibreMap.queryRenderedFeatures(undefined, { layers: [inputLayerID] });
    }, layerID);

export const waitUntilRenderedFeatures = async (
    layerID: string,
    expectNumFeatures: number,
    timeoutMS: number
): Promise<MapGeoJSONFeature[]> => {
    let currentFeatures: MapGeoJSONFeature[] = [];
    return tryBeforeTimeout(
        async (): Promise<MapGeoJSONFeature[]> => {
            while (currentFeatures.length !== expectNumFeatures) {
                await waitForTimeout(1000);
                currentFeatures = await queryRenderedFeatures(layerID);
            }
            return currentFeatures;
        },
        // eslint-disable-next-line max-len
        `Did not get the expected map features for layer ${layerID}. Expected is ${expectNumFeatures} but got ${currentFeatures.length}`,
        timeoutMS
    );
};

export class MapIntegrationTestEnv {
    consoleErrors: ConsoleMessage[] = [];

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
