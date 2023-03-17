import { TomTomMapParams, MapLibreOptions } from "map";
import { MapsSDKThis } from "../types/MapsSDKThis";

export class MapIntegrationTestEnv {
    consoleErrors: unknown[] = [];

    async loadPage() {
        await page.goto("https://localhost:9001");
        page.on("console", (message) => message.type() === "error" && this.consoleErrors.push(message));
    }

    async loadMap(mapLibreOptions: Partial<MapLibreOptions>, tomtomMapParams?: TomTomMapParams) {
        this.consoleErrors = [];
        return page.evaluate(
            (pageMapLibreOptions, pageTomTomMapParams, pageAPIKey) => {
                document.querySelector("canvas")?.remove();
                const mapsSDKThis = globalThis as MapsSDKThis;
                mapsSDKThis.tomtomMap = new mapsSDKThis.MapsSDK.TomTomMap(
                    { ...pageMapLibreOptions, container: document.getElementById("map") },
                    { ...pageTomTomMapParams, apiKey: pageAPIKey }
                );
                mapsSDKThis.mapLibreMap = mapsSDKThis.tomtomMap.mapLibreMap;
            },
            // @ts-ignore
            mapLibreOptions,
            tomtomMapParams,
            process.env.API_KEY
        );
    }
}
