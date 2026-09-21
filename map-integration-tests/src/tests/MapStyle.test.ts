import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
    HILLSHADE_SOURCE_ID,
    mapStyleLayerIDs,
    standardStyleIDs,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getAppliedStyles,
    getLayerById,
    getLoadedStyleMapParameter,
    getNumLayersBySource,
    getNumVisibleLayersBySource,
    getNumVisiblePOILayers,
    isMapReady,
    recordAppliedStyles,
    setStyle,
    setStyleExpectingFailure,
    setStylesInOneBurst,
    setStylesOverlapping,
    waitForMapReady,
} from './util/TestUtils';

// The `map` URL parameter the SDK builds for each standard style. It identifies a style in the two
// records these tests keep, which answer two different questions that `getStyle()` answers neither
// of - the map reports the style it was asked for, which is exactly what a superseded or failed
// switch must not be trusted about. Off the network, `recordLoadedStyles` shows which style
// documents the renderer fetched, the only witness to a request that was never made. In the page,
// `recordAppliedStyles` shows which of them MapLibre put on the map, and in which order.
const styleUrlParameters = {
    monoLight: 'basic_mono-light',
    drivingDark: 'basic_street-dark-driving',
    satellite: 'basic_street-satellite',
    standardDark: 'basic_street-dark',
} as const;

// A style that no server answers: the SDK reports it as a failed switch instead of hanging.
const unreachableStyle = { type: 'custom', url: 'https://localhost:9001/no-such-style.json' } as const;

// Collects the URL of every style document the renderer loads from now on, in the order the
// responses arrive. Standard styles are recognised by their path; a custom style is any URL the
// caller names, so that a test can also show that a style it expects to fail never arrived.
const recordLoadedStyles = (page: Page, ...customStyleUrls: string[]): string[] => {
    const loaded: string[] = [];
    page.on('response', (response) => {
        const isStyleDocument =
            new URL(response.url()).pathname.endsWith('/style.json') || customStyleUrls.includes(response.url());
        if (isStyleDocument && response.ok()) {
            loaded.push(response.url());
        }
    });
    return loaded;
};

// The `map` parameter of each recorded style URL. A custom style carries none and reads as ''.
const mapParametersOf = (styleUrls: string[]): string[] =>
    styleUrls.map((styleUrl) => new URL(styleUrl).searchParams.get('map') ?? '');

const getStyle = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).tomtomMap.getStyle());

const expectStandardStyleLayers = async (page: Page) => {
    expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
    expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
    expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
    expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();
};

const expectModuleLayers = async (page: Page) => {
    expect(await getNumLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
    expect(await getNumLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
    expect(await getNumLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
};

const initModules = async (page: Page) =>
    page.evaluate(async () => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        await mapsSdkThis.MapsSDK.TrafficIncidentsModule.get(mapsSdkThis.tomtomMap, { visible: true });
        await mapsSdkThis.MapsSDK.TrafficFlowModule.get(mapsSdkThis.tomtomMap, { visible: true });
        await mapsSdkThis.MapsSDK.HillshadeModule.get(mapsSdkThis.tomtomMap, { visible: true });
    });

test.describe('Map Style tests', () => {
    const mapEnv = new MapTestEnv();

    test('Switching between all standard styles', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });
        await waitForMapReady(page);

        await initModules(page);

        expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
        expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();

        // Switch to each standard style and verify layers remain
        for (const styleId of standardStyleIDs) {
            await setStyle(page, styleId);

            expect(await getNumVisiblePOILayers(page)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getLayerById(page, mapStyleLayerIDs.lowestLabel)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.lowestPlaceLabel)).toBeDefined();
            expect(await getLayerById(page, mapStyleLayerIDs.country)).toBeDefined();
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A burst of setStyle calls loads only the last style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });
        await waitForMapReady(page);
        await initModules(page);

        const loadedStyles = recordLoadedStyles(page);
        await recordAppliedStyles(page);
        await setStylesInOneBurst(page, ['monoLight', 'drivingDark', 'satellite', 'standardDark']);

        // Every call resolved, so the switch is over: nothing is left to wait for.
        expect(await isMapReady(page)).toBe(true);
        // The three superseded calls never reached the network: each of them was already the wrong
        // style by the time it got past its style-change handlers. Polled because the responses
        // reach this recorder over the browser connection, independently of the calls above.
        await expect.poll(() => mapParametersOf(loadedStyles)).toEqual([styleUrlParameters.standardDark]);
        // And the one document that did arrive is the only style the renderer ever applied.
        expect(await getAppliedStyles(page)).toEqual([styleUrlParameters.standardDark]);
        expect(await getLoadedStyleMapParameter(page)).toBe(styleUrlParameters.standardDark);
        expect(await getStyle(page)).toBe('standardDark');
        await expectStandardStyleLayers(page);
        await expectModuleLayers(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Overlapping style loads settle on the last style', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });
        await waitForMapReady(page);
        await initModules(page);

        const loadedStyles = recordLoadedStyles(page);
        await recordAppliedStyles(page);
        // 100 ms apart: far enough for each call to start its own load, close enough that the
        // previous one is still in flight when it does.
        await setStylesOverlapping(page, ['monoLight', 'drivingDark', 'standardDark'], 100);

        expect(await isMapReady(page)).toBe(true);
        // The renderer may have loaded any number of the three; what counts is that the last style
        // it applied is the last one asked for. An earlier load arriving late and winning would
        // show up here as a further style applied after `standardDark`.
        expect((await getAppliedStyles(page)).at(-1)).toBe(styleUrlParameters.standardDark);
        expect(await getLoadedStyleMapParameter(page)).toBe(styleUrlParameters.standardDark);
        await expect.poll(() => mapParametersOf(loadedStyles)).toContain(styleUrlParameters.standardDark);
        expect(await getStyle(page)).toBe('standardDark');
        await expectStandardStyleLayers(page);
        // The modules were restored onto the style that actually ended up on the map, not onto one
        // of the styles that were superseded on the way.
        await expectModuleLayers(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A style that never loads leaves the previous one on the map and the next switch works', async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { center: [7.12621, 48.50394], zoom: 10 });
        await waitForMapReady(page);
        await initModules(page);

        await setStyle(page, 'monoLight');
        // The unreachable URL is named so that this record covers it too: were it to answer, the
        // load would be counted rather than filtered out for not being a standard style.
        const loadedStyles = recordLoadedStyles(page, unreachableStyle.url);
        await recordAppliedStyles(page);

        expect(await setStyleExpectingFailure(page, unreachableStyle)).not.toBe('');

        // Nothing loaded and nothing was applied, so the map still shows monoLight with all the
        // module layers on it.
        expect(loadedStyles).toHaveLength(0);
        expect(await getAppliedStyles(page)).toHaveLength(0);
        expect(await getLoadedStyleMapParameter(page)).toBe(styleUrlParameters.monoLight);
        await expectStandardStyleLayers(page);
        await expectModuleLayers(page);
        // The failed switch is not a finished one: the map stays not-ready until a style loads.
        expect(await isMapReady(page)).toBe(false);

        // Whatever the unreachable URL logged belongs to that attempt alone; the switch that
        // follows it has to be clean.
        mapEnv.consoleErrors = [];
        await setStyle(page, 'standardDark');

        await expect.poll(() => mapParametersOf(loadedStyles)).toEqual([styleUrlParameters.standardDark]);
        expect(await getAppliedStyles(page)).toEqual([styleUrlParameters.standardDark]);
        expect(await getStyle(page)).toBe('standardDark');
        await expectStandardStyleLayers(page);
        await expectModuleLayers(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
