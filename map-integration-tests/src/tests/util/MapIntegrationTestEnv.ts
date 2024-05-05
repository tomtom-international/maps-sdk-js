import type { MapLibreOptions, TomTomMapParams } from "map";
import type { MapsSDKThis } from "../types/MapsSDKThis";
import type { ConsoleMessage } from "puppeteer";

// @see https://github.com/puppeteer/puppeteer/issues/3397
const parseConsoleMessage = async (message: ConsoleMessage): Promise<string> => {
    if (message.text() != "JSHandle@error") {
        return message.text();
    }
    const messages = await Promise.all(message.args().map((arg) => arg.getProperty("message")));
    return messages.join(" | ");
};

const resetMapModules = async () =>
    page.evaluate(() => {
        const mapSDKThis = globalThis as MapsSDKThis;
        mapSDKThis.baseMap = undefined;
        mapSDKThis.baseMap2 = undefined;
        mapSDKThis.trafficIncidents = undefined;
        mapSDKThis.trafficFlow = undefined;
        mapSDKThis.pois = undefined;
        mapSDKThis.hillshade = undefined;
        mapSDKThis.places = undefined;
        mapSDKThis.places2 = undefined;
        mapSDKThis.geometries = undefined;
        mapSDKThis.routing = undefined;
    });

const resetEventsTestData = async () =>
    page.evaluate(() => {
        const mapSDKThis = globalThis as MapsSDKThis;
        mapSDKThis._clickedLngLat = undefined;
        mapSDKThis._clickedTopFeature = undefined;
        mapSDKThis._clickedSourceWithLayers = undefined;
        mapSDKThis._clickedFeatures = undefined;
        mapSDKThis._numOfClicks = 0;
        mapSDKThis._numOfContextmenuClicks = 0;
        mapSDKThis._numOfHovers = 0;
        mapSDKThis._numOfLongHovers = 0;
        mapSDKThis._hoveredTopFeature = undefined;
    });

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
        await resetMapModules();
        await resetEventsTestData();
        await page.evaluate(
            (pageMapLibreOptions, pageTomTomMapParams, pageAPIKey) => {
                document.querySelector(".maplibregl-control-container")?.remove();
                document.querySelector("canvas")?.remove();
                this.consoleErrors = [];
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
