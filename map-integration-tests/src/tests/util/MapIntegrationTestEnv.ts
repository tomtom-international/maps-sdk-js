import { TomTomMapParams, MapLibreOptions } from "map";
import { MapsSDKThis } from "../types/MapsSDKThis";
import { ConsoleMessage } from "puppeteer";

// @see https://github.com/puppeteer/puppeteer/issues/3397
const parseConsoleMessage = async (message: ConsoleMessage): Promise<string> => {
    if (message.text() != "JSHandle@error") {
        return message.text();
    }
    const messages = await Promise.all(message.args().map((arg) => arg.getProperty("message")));
    return messages.join(" | ");
};

export class MapIntegrationTestEnv {
    consoleErrors: string[] = [];

    async loadPage() {
        this.consoleErrors = [];
        await page.goto("https://localhost:9001");
        page.on(
            "console",
            async (message) => message.type() === "error" && this.consoleErrors.push(await parseConsoleMessage(message))
        );
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
