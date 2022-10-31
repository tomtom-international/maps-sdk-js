import { ConsoleMessage } from "puppeteer";
import { SymbolLayerSpecification } from "maplibre-gl";
import { GOSDKMapParams, LayerSpecWithSource, MapLibreOptions } from "map";
import { GOSDKThis } from "./types/GOSDKThis";

const tryBeforeTimeout = async (func: () => Promise<unknown>, errorMSG: string, timeoutMS: number) => {
    await Promise.race([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMSG)), timeoutMS))]);
};

export class MapIntegrationTestEnv {
    consoleErrors: ConsoleMessage[] = [];

    async loadPage() {
        await page.goto("https://localhost:9000");
        page.on("console", (message) => message.type() === "error" && this.consoleErrors.push(message));
    }

    async loadMap(mapLibreOptions: Partial<MapLibreOptions>, goSDKParams: Partial<GOSDKMapParams>) {
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

    async waitForMapToLoad() {
        return tryBeforeTimeout(
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
            10000
        );
    }

    async getNumVisibleLayersBySource(sourceID: string): Promise<number> {
        return (await this.getVisibleLayersBySource(sourceID))?.length;
    }

    async getVisibleLayersBySource(sourceID: string): Promise<LayerSpecWithSource[]> {
        return page.evaluate((pageSourceID) => {
            return (globalThis as GOSDKThis).mapLibreMap
                .getStyle()
                .layers.filter(
                    (layer) =>
                        (layer as LayerSpecWithSource).source === pageSourceID && layer.layout?.visibility !== "none"
                ) as LayerSpecWithSource[];
        }, sourceID);
    }

    async getSymbolLayersByID(layerID: string): Promise<SymbolLayerSpecification> {
        return page.evaluate((symbolLayerID) => {
            return (globalThis as GOSDKThis).mapLibreMap
                .getStyle()
                .layers.filter((layer) => layer.id === symbolLayerID)[0] as SymbolLayerSpecification;
        }, layerID);
    }
}
