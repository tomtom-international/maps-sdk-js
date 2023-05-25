import { TomTomMapParams, MapLibreOptions } from "map";
import { MapsSDKThis } from "../types/MapsSDKThis";

export class MapIntegrationTestEnv {
    consoleErrors: string[] = [];

    async loadPage() {
        await page.goto("https://localhost:9001");
        page.on("console", (message) => message.type() === "error" && this.consoleErrors.push(message.text()));
    }

    async loadMap(mapLibreOptions: Partial<MapLibreOptions>, tomtomMapParams?: Partial<TomTomMapParams>) {
        this.consoleErrors = [];
        return page.evaluate(
            (pageMapLibreOptions, pageTomTomMapParams, pageAPIKey) => {
                document.querySelector("canvas")?.remove();
                const mapsSDKThis = globalThis as MapsSDKThis;
                mapsSDKThis.tomtomMap = new mapsSDKThis.MapsSDK.TomTomMap(
                    { ...pageMapLibreOptions, container: "map" },
                    { ...pageTomTomMapParams, apiKey: pageAPIKey }
                );
                mapsSDKThis.mapLibreMap = mapsSDKThis.tomtomMap.mapLibreMap;
            },
            mapLibreOptions,
            tomtomMapParams,
            process.env.API_KEY
        );
    }
}
