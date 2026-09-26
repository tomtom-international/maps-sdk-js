import { expect, test } from '@playwright/test';
import type { MapColors, POIsModule, StylingCatalogue, StylingKnobId, StylingSettings } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { getLayerById, getPaintProperty, initPOIs, isLayerVisible, setStyle, waitForMapReady } from './util/TestUtils';

const initStyling = async (page: import('@playwright/test').Page, settings?: StylingSettings) =>
    page.evaluate(async (inputSettings) => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.styling = await mapsSdkThis.MapsSDK.StylingModule.get(mapsSdkThis.tomtomMap, inputSettings);
    }, settings);

const describeStyling = async (page: import('@playwright/test').Page): Promise<StylingCatalogue> =>
    page.evaluate(() => (globalThis as MapsSDKThis).styling?.describe() as StylingCatalogue);

const setKnob = async (page: import('@playwright/test').Page, id: StylingKnobId, value: unknown) =>
    page.evaluate(({ id, value }) => (globalThis as MapsSDKThis).styling?.set(id, value as never), { id, value });

const setMapColors = async (page: import('@playwright/test').Page, colors: MapColors) =>
    page.evaluate((input) => (globalThis as MapsSDKThis).styling?.setMapColors(input), colors);

const resetKnob = async (page: import('@playwright/test').Page, id?: StylingKnobId) =>
    page.evaluate((inputId) => (globalThis as MapsSDKThis).styling?.reset(inputId), id);

const getStylingConfig = async (page: import('@playwright/test').Page) =>
    page.evaluate(() => (globalThis as MapsSDKThis).styling?.getConfig());

const getLayerFilter = async (page: import('@playwright/test').Page, layerId: string): Promise<unknown> =>
    page.evaluate((id) => (globalThis as MapsSDKThis).mapLibreMap.getFilter(id) as unknown, layerId);

// What actually shows behind the map, which is where `view.spaceColor` lands.
const spaceColorOnPage = async (page: import('@playwright/test').Page): Promise<string> =>
    page.evaluate(() => getComputedStyle(document.getElementById('map') as HTMLElement).backgroundColor);

const filterPOICategories = async (
    page: import('@playwright/test').Page,
    categories: Parameters<POIsModule['filterCategories']>[0],
) => page.evaluate((input) => (globalThis as MapsSDKThis).pois?.filterCategories(input), categories);

// The offset of the `["-", ["zoom"], n]` term the TomTom styles stagger POI density with, which
// `pois.zoomShift` moves. Read from the filter rather than assumed, so the assertions hold across
// styles that stagger from a different zoom.
const zoomOffsetIn = (filter: unknown): number => {
    const term = /\["-",\["zoom"\],(-?\d+(?:\.\d+)?)\]/.exec(JSON.stringify(filter));
    if (!term) throw new Error(`no zoom offset term in ${JSON.stringify(filter)}`);

    return Number(term[1]);
};

test.describe('StylingModule tests', () => {
    const mapEnv = new MapTestEnv();

    test.beforeEach(async ({ page }) => {
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapReady(page);
        await initStyling(page);
    });

    // The live version guard: every curated knob must still reach the layers it was curated for in
    // the style version the SDK pins. A bump that renames or regroups layers fails here, not at a
    // customer's.
    test('every knob reaches at least one layer of the live standard style', async ({ page }) => {
        const { knobs } = await describeStyling(page);
        const unreached = knobs.filter((knob) => !knob.available).map((knob) => knob.id);
        expect(unreached).toEqual([]);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('a factor knob rewrites the property and reset restores it', async ({ page }) => {
        const before = (await getLayerById(page, 'Surface - Motorway & Trunk')).paint as Record<string, unknown>;
        await setKnob(page, 'roads.widthFactor', 1.5);
        const scaled = await getPaintProperty(page, 'Surface - Motorway & Trunk', 'line-width');
        expect(JSON.stringify(scaled)).toContain('"*",1.5');

        await resetKnob(page, 'roads.widthFactor');
        const restored = await getPaintProperty(page, 'Surface - Motorway & Trunk', 'line-width');
        expect(restored).toEqual(before['line-width']);
        expect(await getStylingConfig(page)).toBeUndefined();
    });

    test('toggles hide and show their layers, and survive a style switch', async ({ page }) => {
        expect(await isLayerVisible(page, 'TransitLabels - Exit Number')).toBe(true);
        await setKnob(page, 'roads.exitNumbers', false);
        await setKnob(page, 'buildings.3d', true);
        expect(await isLayerVisible(page, 'TransitLabels - Exit Number')).toBe(false);
        expect(await isLayerVisible(page, '3D - Building')).toBe(true);

        await setStyle(page, 'standardDark');
        await waitForMapReady(page);
        // Re-applied on the new style, on top of what the base map restored.
        expect(await isLayerVisible(page, 'TransitLabels - Exit Number')).toBe(false);
        expect(await isLayerVisible(page, '3D - Building')).toBe(true);
        expect(await getStylingConfig(page)).toEqual({ 'roads.exitNumbers': false, 'buildings.3d': true });
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // `pois.zoomShift` rewrites the filter of the POI layer that `POIsModule.filterCategories` also
    // narrows. Both write through the shared filter composer, so neither may drop the other — the
    // live check that the two modules still share that one layer property.
    test('a filter knob and POI category filtering compose on the same layer', async ({ page }) => {
        await initPOIs(page);
        const styleOffset = zoomOffsetIn(await getLayerFilter(page, 'POI'));

        await setKnob(page, 'pois.zoomShift', 2);
        expect(zoomOffsetIn(await getLayerFilter(page, 'POI'))).toBe(styleOffset + 2);

        // The category clause joins the shifted filter instead of replacing it.
        await filterPOICategories(page, { show: 'only', values: ['RESTAURANT'] });
        const composed = await getLayerFilter(page, 'POI');
        expect(zoomOffsetIn(composed)).toBe(styleOffset + 2);
        expect(JSON.stringify(composed)).toContain('"category"');

        // And the clause outlives the knob moving again, and going back to the style's own value.
        await setKnob(page, 'pois.zoomShift', -1);
        const reshifted = await getLayerFilter(page, 'POI');
        expect(zoomOffsetIn(reshifted)).toBe(styleOffset - 1);
        expect(JSON.stringify(reshifted)).toContain('"category"');

        await resetKnob(page, 'pois.zoomShift');
        const afterReset = await getLayerFilter(page, 'POI');
        expect(zoomOffsetIn(afterReset)).toBe(styleOffset);
        expect(JSON.stringify(afterReset)).toContain('"category"');
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('the knob and the category filter are both restored on the next style', async ({ page }) => {
        await initPOIs(page);
        await setKnob(page, 'pois.zoomShift', 2);
        await filterPOICategories(page, { show: 'only', values: ['RESTAURANT'] });

        await setStyle(page, 'standardDark');
        await waitForMapReady(page);

        const restored = await getLayerFilter(page, 'POI');
        expect(JSON.stringify(restored)).toContain('"category"');

        // The new style's own offset is whatever it ships; the knob must sit two above it.
        await resetKnob(page, 'pois.zoomShift');
        const withoutKnob = await getLayerFilter(page, 'POI');
        expect(zoomOffsetIn(restored)).toBe(zoomOffsetIn(withoutKnob) + 2);
        expect(JSON.stringify(withoutKnob)).toContain('"category"');
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('a colour knob recolours the class and its outline shade', async ({ page }) => {
        await setKnob(page, 'traffic.flow.slowColor', 'hsl(200, 100%, 51%)');
        expect(await getPaintProperty(page, 'Traffic - Slow flow', 'line-color')).toBe('hsl(200, 100%, 51%)');
        const outline = (await getPaintProperty(page, 'Traffic - Slow flow outline', 'line-color')) as string;
        expect(outline).toMatch(/^hsl\(200, /);
        expect(outline).not.toBe('hsl(200, 100%, 51%)');
    });

    // The page owns what shows behind the map where it says so, and only an unpainted container
    // falls to the SDK's theme colour. The live check that the knob reads a background from a
    // stylesheet, which `style` alone never sees — so a unit test on a mock container cannot cover it.
    test('a background the page sets in CSS is the space default, through a set and a reset', async ({ page }) => {
        await page.addStyleTag({ content: '#map { background-color: rgb(18, 52, 86); }' });
        // The module from `beforeEach` already painted the container inline; clear it so this map
        // starts as a page that never had a styling module would.
        await page.evaluate(() => {
            (document.getElementById('map') as HTMLElement).style.backgroundColor = '';
        });
        await mapEnv.loadMap(page, { zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapReady(page);
        await initStyling(page);

        expect(await spaceColorOnPage(page)).toBe('rgb(18, 52, 86)');
        const { knobs } = await describeStyling(page);
        expect(knobs.find((knob) => knob.id === 'view.spaceColor')?.default).toBe('rgb(18, 52, 86)');

        await setKnob(page, 'view.spaceColor', '#05070d');
        expect(await spaceColorOnPage(page)).toBe('rgb(5, 7, 13)');

        await resetKnob(page, 'view.spaceColor');
        expect(await spaceColorOnPage(page)).toBe('rgb(18, 52, 86)');
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // The phase-3 exit criterion of the GA plan: one call recolours the motorway family — surface,
    // outline, tunnel — with the style's zoom curves intact, and survives a style switch.
    test('setMapColors recolours the major-road family, zoom curves intact, across a style switch', async ({
        page,
    }) => {
        const before = (await getPaintProperty(page, 'Surface - Motorway & Trunk', 'line-color')) as unknown[];
        await setMapColors(page, { roadMajor: 'hsl(200, 100%, 50%)' });

        const surface = (await getPaintProperty(page, 'Surface - Motorway & Trunk', 'line-color')) as unknown[];
        expect(JSON.stringify(surface)).toContain('hsl(200,');
        expect(JSON.stringify(surface)).not.toContain('hsl(47,');
        // Same expression shape: the zoom interpolation and its stops are untouched.
        expect(surface[0]).toBe(before[0]);
        expect(surface.length).toBe(before.length);
        expect(
            JSON.stringify(await getPaintProperty(page, 'Surface - Motorway & Trunk outline', 'line-color')),
        ).toContain('hsl(200,');
        expect(JSON.stringify(await getPaintProperty(page, 'Tunnel - Road line', 'line-color'))).toContain('hsl(200,');

        await setStyle(page, 'standardDark');
        await waitForMapReady(page);
        expect(JSON.stringify(await getPaintProperty(page, 'Surface - Motorway & Trunk', 'line-color'))).toContain(
            'hsl(200,',
        );
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('hillshade knobs, base-map group toggles and raw layer edits reach the live style', async ({ page }) => {
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            await mapsSdkThis.MapsSDK.TerrainModule.get(mapsSdkThis.tomtomMap, { hillshade: true });
        });
        await setKnob(page, 'hillshade.method', 'multidirectional');
        await setKnob(page, 'hillshade.maxZoom', 22);
        expect(await getPaintProperty(page, 'Hillshade', 'hillshade-method')).toBe('multidirectional');
        expect((await getLayerById(page, 'Hillshade')).maxzoom).toBe(22);

        await setKnob(page, 'basemap.railways', false);
        expect(await isLayerVisible(page, 'Surface - Railway outline')).toBe(false);
        expect(await isLayerVisible(page, 'Surface - Motorway & Trunk')).toBe(true);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).styling?.layers
                .query({ group: 'roadLabels' })
                .setPaint({ 'text-color': '#93c5fd' }),
        );
        expect(await getPaintProperty(page, 'TransitLabels - Road', 'text-color')).toBe('#93c5fd');
        await setStyle(page, 'standardDark');
        await waitForMapReady(page);
        // The raw edit is re-applied on the new style; it is not a setting.
        expect(await getPaintProperty(page, 'TransitLabels - Road', 'text-color')).toBe('#93c5fd');
        expect(await getStylingConfig(page)).toEqual({
            'hillshade.method': 'multidirectional',
            'hillshade.maxZoom': 22,
            'basemap.railways': false,
        });
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('a clean style switch drops the settings', async ({ page }) => {
        await setKnob(page, 'labels.sizeFactor', 1.3);
        await page.evaluate(async () => {
            const mapsSdkThis = globalThis as MapsSDKThis;
            await mapsSdkThis.tomtomMap.setStyle('monoLight', { resetState: true });
        });
        await waitForMapReady(page);
        expect(await getStylingConfig(page)).toBeUndefined();
        const { knobs } = await describeStyling(page);
        expect(knobs.find((knob) => knob.id === 'labels.sizeFactor')?.overridden).toBe(false);
    });
});
