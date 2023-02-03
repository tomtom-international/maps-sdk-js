import { GOSDKMapParams, MapLibreOptions } from "map";
import { GOSDKThis } from "../types/GOSDKThis";

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
