import type { ConsoleMessage, Page } from '@playwright/test';
import type { MapLibreOptions, TomTomMapParams } from 'map';
import { MapsSDKThis } from '../types/MapsSDKThis';

const parseConsoleMessage = async (message: ConsoleMessage): Promise<string> => {
    if (message.text() != 'JSHandle@error') {
        return message.text();
    }
    const messages = await Promise.all(message.args().map((arg) => arg.getProperty('message')));
    return messages.join(' | ');
};

const resetMapModules = async (page: Page) =>
    page.evaluate(() => {
        const mapSdkThis = globalThis as MapsSDKThis;
        mapSdkThis.baseMap = undefined;
        mapSdkThis.baseMap2 = undefined;
        mapSdkThis.trafficIncidents = undefined;
        mapSdkThis.trafficFlow = undefined;
        mapSdkThis.pois = undefined;
        mapSdkThis.hillshade = undefined;
        mapSdkThis.places = undefined;
        mapSdkThis.places2 = undefined;
        mapSdkThis.geometries = undefined;
        mapSdkThis.routing = undefined;
        mapSdkThis.routing2 = undefined;
    });

const resetEventsTestData = async (page: Page) =>
    page.evaluate(() => {
        const mapSdkThis = globalThis as MapsSDKThis;
        mapSdkThis._clickedLngLat = undefined;
        mapSdkThis._clickedTopFeature = undefined;
        mapSdkThis._clickedSourceWithLayers = undefined;
        mapSdkThis._clickedFeatures = undefined;
        mapSdkThis._numOfClicks = 0;
        mapSdkThis._numOfContextmenuClicks = 0;
        mapSdkThis._numOfHovers = 0;
        mapSdkThis._numOfLongHovers = 0;
        mapSdkThis._hoveredTopFeature = undefined;
    });

export class MapTestEnv {
    consoleErrors: string[] = [];

    async loadPage(page: Page) {
        this.consoleErrors = [];
        await page.goto('https://localhost:9001');

        // TODO: get rid of puppeteer stuff from parseConsoleMessage and also detect pageerrors
        page.on(
            'console',
            async (message) =>
                message.type() === 'error' && this.consoleErrors.push(await parseConsoleMessage(message)),
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
                const mapsSdkThis = globalThis as MapsSDKThis;
                mapsSdkThis.mapLibreMap?.remove();
                document.querySelector('.maplibregl-control-container')?.remove();
                document.querySelector('canvas')?.remove();
                mapsSdkThis.tomtomMap = new mapsSdkThis.MapsSDK.TomTomMap({
                    ...tomtomMapParams,
                    apiKey,
                    mapLibre: { ...mapLibreOptions, container: 'map' },
                });
                mapsSdkThis.mapLibreMap = mapsSdkThis.tomtomMap.mapLibreMap;
            },
            { mapLibreOptions, tomtomMapParams, apiKey: process.env.API_KEY_TESTS },
        );
    }

    async loadPageAndMap(page: Page, mapLibreOptions: Partial<MapLibreOptions>, tomtomMapParams?: Partial<TomTomMapParams>) {
        await this.loadPage(page);
        await this.loadMap(page, mapLibreOptions, tomtomMapParams);
    }

    static async loadPageAndMap(
        page: Page,
        mapLibreOptions: Partial<MapLibreOptions>,
        tomtomMapParams?: Partial<TomTomMapParams>,
    ) {
        const env = new MapTestEnv();
        await env.loadPageAndMap(page, mapLibreOptions, tomtomMapParams);
        return env;
    }
}
