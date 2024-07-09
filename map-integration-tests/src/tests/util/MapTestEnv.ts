import type { MapLibreOptions, TomTomMapParams } from "map";
import type { MapsSDKThis } from "../types/MapsSDKThis";
import type { ConsoleMessage, Page } from "@playwright/test";

const parseConsoleMessage = async (message: ConsoleMessage): Promise<string> => {
    if (message.text() != "JSHandle@error") {
        return message.text();
    }
    const messages = await Promise.all(message.args().map((arg) => arg.getProperty("message")));
    return messages.join(" | ");
};

const resetMapModules = async (page: Page) =>
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

const resetEventsTestData = async (page: Page) =>
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

export class MapTestEnv {
    consoleErrors: string[] = [];

    async loadPage(page: Page) {
        this.consoleErrors = [];
        await page.goto("https://localhost:9001");

        // TODO: get rid of puppeteer stuff from parseConsoleMessage and also detect pageerrors
        page.on(
            "console",
            async (message) => message.type() === "error" && this.consoleErrors.push(await parseConsoleMessage(message))
        );
    }

    async loadMap(page: Page, mapLibreOptions: Partial<MapLibreOptions>, tomtomMapParams?: Partial<TomTomMapParams>) {
        this.consoleErrors = [];
        await resetMapModules(page);
        await resetEventsTestData(page);
        await page.evaluate(
            // @ts-ignore
            ({ mapLibreOptions, tomtomMapParams, apiKey }) => {
                this.consoleErrors = [];
                const mapsSDKThis = globalThis as MapsSDKThis;
                mapsSDKThis.mapLibreMap?.remove();
                document.querySelector(".maplibregl-control-container")?.remove();
                document.querySelector("canvas")?.remove();
                mapsSDKThis.tomtomMap = new mapsSDKThis.MapsSDK.TomTomMap(
                    { ...mapLibreOptions, container: "map" },
                    { ...tomtomMapParams, apiKey }
                );
                mapsSDKThis.mapLibreMap = mapsSDKThis.tomtomMap.mapLibreMap;
            },
            { mapLibreOptions, tomtomMapParams, apiKey: process.env.API_KEY }
        );
    }

    async loadPageAndMap(
        page: Page,
        mapLibreOptions: Partial<MapLibreOptions>,
        tomtomMapParams?: Partial<TomTomMapParams>
    ) {
        await this.loadPage(page);
        await this.loadMap(page, mapLibreOptions, tomtomMapParams);
    }

    static async loadPageAndMap(
        page: Page,
        mapLibreOptions: Partial<MapLibreOptions>,
        tomtomMapParams?: Partial<TomTomMapParams>
    ) {
        const env = new MapTestEnv();
        await env.loadPageAndMap(page, mapLibreOptions, tomtomMapParams);
        return env;
    }
}
