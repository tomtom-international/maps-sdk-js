// @vitest-environment jsdom
// `view.spaceColor` reads the container's computed background, which needs a real DOM.
import type { ExpressionFilterSpecification, LayerSpecification, Map, SkySpecification } from 'maplibre-gl';
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import { knobSettings } from '../../shared';
import { LayerFilterComposer } from '../../shared/layers/layerFilterComposer';
import type { StyleChangeHandler, TomTomMap } from '../../TomTomMap';
import { type StylingColorKnobId, stylingColorKnobIds, stylingKnobIds } from '../knobCatalogue';
import { mapColorNames } from '../mapColorCatalogue';
import { StylingModule } from '../StylingModule';
import { orbisStreetLightLayers } from './data/orbisStreetLightLayers.data';

// The sources of the compiled standard style, as far as the knobs care (vector vs. not).
const fixtureSources = {
    vectorTiles: { type: 'vector' },
    vectorTilesFlow: { type: 'vector' },
    vectorTilesIncidents: { type: 'vector' },
    hillshade: { type: 'raster-dem' },
};

// A MapLibre map over the fixture's layers: property setters are recorded, and the style the module
// indexes on a restore is whatever `layers` holds at that moment.
const makeMapLibreMock = (
    layers: LayerSpecification[],
    sources: Record<string, { type: string }> = fixtureSources,
    sky?: SkySpecification,
) => {
    const state = { layers };
    // Real element rather than a stub: the space knob reads the computed background off it, and a
    // test paints it first to stand in for a page that styles its own map container. Attached,
    // since jsdom serves a detached element a computed style frozen at creation.
    const container = document.body.appendChild(document.createElement('div'));
    return {
        state,
        container,
        getStyle: vi.fn(() => ({ layers: state.layers, sources, sky })),
        getLayer: vi.fn((id: string) => state.layers.find((layer) => layer.id === id)),
        setLayoutProperty: vi.fn(),
        setPaintProperty: vi.fn(),
        getPaintProperty: vi.fn(),
        getLayoutProperty: vi.fn(),
        setLayerZoomRange: vi.fn(),
        getFilter: vi.fn((id: string) => {
            const layer = state.layers.find((candidate) => candidate.id === id);
            return layer && 'filter' in layer ? layer.filter : undefined;
        }),
        setFilter: vi.fn(),
        setProjection: vi.fn(),
        setSky: vi.fn(),
        // The module paints the container behind the canvas, which a globe leaves visible.
        getContainer: vi.fn(() => container),
        isStyleLoaded: vi.fn().mockReturnValue(true),
        once: vi.fn(),
    };
};

type MapLibreMock = ReturnType<typeof makeMapLibreMock>;

const makeTomTomMapMock = (mapLibre: MapLibreMock) => {
    const styleChangeHandlers: StyleChangeHandler[] = [];
    const tomtomMap = {
        mapLibreMap: mapLibre as unknown as Map,
        _eventsProxy: { updateIfRegistered: vi.fn() },
        addStyleChangeHandler: vi.fn((handler: StyleChangeHandler) => {
            styleChangeHandlers.push(handler);
            return () => undefined;
        }),
        mapReady: true,
        styleLightDarkTheme: 'light',
    } as unknown as TomTomMap;
    return { tomtomMap, styleChangeHandlers };
};

// Every recorded call to a setter for one layer + property, latest last.
const valuesSetFor = (setter: Mock, layerId: string, property: string) =>
    setter.mock.calls.filter((call) => call[0] === layerId && call[1] === property).map((call) => call[2]);

const lastValueSetFor = (setter: Mock, layerId: string, property: string) =>
    valuesSetFor(setter, layerId, property).at(-1);

// This module's own style-change handler; the shared filter composer registers one of its own as
// soon as a knob writes a layer filter.
const stylingHandlerIn = (handlers: StyleChangeHandler[]) => handlers.find((handler) => handler.priority === 100);

const lastFilterSetFor = (mapLibre: MapLibreMock, layerId: string) =>
    mapLibre.setFilter.mock.calls.findLast((call) => call[0] === layerId)?.[1];

describe('StylingModule', () => {
    let mapLibre: MapLibreMock;
    let tomtomMap: TomTomMap;
    let styleChangeHandlers: StyleChangeHandler[];
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // A fresh spy per test: spying on an already spied console.warn would keep the old counts.
        vi.restoreAllMocks();
        mapLibre = makeMapLibreMock(orbisStreetLightLayers);
        ({ tomtomMap, styleChangeHandlers } = makeTomTomMapMock(mapLibre));
        warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    // The version guard: a knob whose curated table no longer matches the pinned style is a knob
    // that silently does nothing for every customer. This is the test that fails first on a bump.
    describe('version guard against the pinned style', () => {
        test('every knob reaches at least one layer of the compiled standard style', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const unreached = styling
                .describe()
                .knobs.filter((knob) => !knob.available)
                .map((knob) => knob.id);
            expect(unreached).toStrictEqual([]);
            expect(warn).not.toHaveBeenCalled();
        });

        test('the catalogue lists every knob with its kind and a readable default', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const { knobs } = styling.describe();
            expect(knobs.map((knob) => knob.id)).toStrictEqual(stylingKnobIds);
            expect(knobSettings(knobs)).toStrictEqual({});
            for (const knob of knobs) {
                expect(knob.overridden).toBe(false);
                expect(knob.current).toBe(knob.default);
                if (knob.kind === 'factor') expect(knob.default).toBe(1);
                if (knob.kind === 'toggle') expect(typeof knob.default).toBe('boolean');
                // A colour default is the style's literal, or undefined where the style uses an expression.
                if (knob.kind === 'color') expect(['string', 'undefined']).toContain(typeof knob.default);
                if (knob.kind === 'enum') expect(knob.options).toContain(knob.default);
                if (knob.kind === 'factor' || knob.kind === 'number') expect(knob.range).toBeDefined();
            }
            expect(styling.describe().presets.map((preset) => preset.id)).toContain('data-viz');
        });

        test('the colour knob ids are exactly the knobs the catalogue describes as colours', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const colorKnobs = styling.describe().knobs.filter((knob) => knob.kind === 'color');
            expect(stylingColorKnobIds).toStrictEqual(colorKnobs.map((knob) => knob.id));

            const colorKnob: StylingColorKnobId = 'traffic.incidents.majorColor';
            // @ts-expect-error a toggle is not a colour knob
            const toggle: StylingColorKnobId = 'buildings.3d';
            expect(stylingColorKnobIds).toContain(colorKnob);
            expect(stylingColorKnobIds).not.toContain(toggle);
        });

        test('reads defaults off the style: toggle visibility, POIs from zoom 6, free flow is green', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const shippedVisible = (layerId: string) => {
                const layer = orbisStreetLightLayers.find((candidate) => candidate.id === layerId);
                const layout = (layer && 'layout' in layer ? layer.layout : undefined) as
                    | { visibility?: string }
                    | undefined;
                return layout?.visibility !== 'none';
            };
            expect(styling.get('buildings.3d')).toBe(shippedVisible('3D - Building'));
            expect(styling.get('roads.exitNumbers')).toBe(shippedVisible('TransitLabels - Exit Number'));
            expect(styling.get('pois.labelColor')).toBeUndefined(); // a per-category match, no single literal
            expect(styling.get('pois.minZoom')).toBe(6);
            expect(styling.get('traffic.flow.freeColor')).toBe('hsl(146, 78%, 53%)');
        });
    });

    describe('factor knobs (transforms)', () => {
        test('scales road widths by wrapping the style expression, and resets to the original', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('roads.widthFactor', 1.5);

            const scaled = lastValueSetFor(
                mapLibre.setPaintProperty,
                'Surface - Motorway & Trunk',
                'line-width',
            ) as unknown[];
            expect(scaled[0]).toBe('interpolate');
            // Stop outputs are matches: wrapped as a whole, so the class hierarchy is kept.
            expect(scaled[4]).toStrictEqual(['*', 1.5, ['match', ['get', 'category'], ['motorway'], 0.4, 0.2]]);
            // Rail and ferry lines are not roads.
            expect(valuesSetFor(mapLibre.setPaintProperty, 'Surface - Railway outline', 'line-width')).toHaveLength(0);

            styling.reset('roads.widthFactor');
            const restored = lastValueSetFor(
                mapLibre.setPaintProperty,
                'Surface - Motorway & Trunk',
                'line-width',
            ) as unknown[];
            expect(restored[4]).toStrictEqual(['match', ['get', 'category'], ['motorway'], 0.4, 0.2]);
            expect(styling.getConfig()).toBeUndefined();
        });

        test('two factors reaching the same property compose as a product', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('labels.sizeFactor', 1.5);
            styling.set('pois.sizeFactor', 0.5);

            // POI text: 1.5 × 0.5 = 0.75, one wrapper for the product.
            const poiTextSize = lastValueSetFor(mapLibre.setLayoutProperty, 'POI', 'text-size') as unknown[];
            expect(poiTextSize[0]).toBe('interpolate');
            expect(poiTextSize[4]).toStrictEqual([
                '*',
                0.75,
                ['/', 16.2, ['log10', ['max', ['length', ['get', 'name']], 30]]],
            ]);
            // Place labels only see the label factor.
            const cityTextSize = lastValueSetFor(mapLibre.setLayoutProperty, 'Places - City', 'text-size') as unknown[];
            expect(cityTextSize[4]).toStrictEqual([
                '*',
                1.5,
                ['match', ['get', 'icon'], 'city_large', 13.2, 'city_medium', 12.1, 'city_small', 11, 11],
            ]);
        });

        test('validates the range and the kind before touching the map', async () => {
            const styling = await StylingModule.get(tomtomMap);
            mapLibre.setPaintProperty.mockClear();
            expect(() => styling.set('roads.widthFactor', 3)).toThrow(RangeError);
            expect(() => styling.set('roads.widthFactor', 'wide' as never)).toThrow(RangeError);
            expect(() => styling.set('buildings.3d', 1 as never)).toThrow(RangeError);
            expect(() => styling.set('traffic.flow.slowColor', 'not-a-colour')).toThrow(RangeError);
            expect(() => styling.set('no.such.knob' as never, 1 as never)).toThrow(/Unknown styling knob/);
            expect(mapLibre.setPaintProperty).not.toHaveBeenCalled();
        });
    });

    describe('toggles and zoom knobs (curated)', () => {
        test('hides exit numbers and shows 3D buildings', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('roads.exitNumbers', false);
            styling.set('buildings.3d', true);

            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'TransitLabels - Exit Number', 'visibility')).toBe(
                'none',
            );
            expect(lastValueSetFor(mapLibre.setLayoutProperty, '3D - Building', 'visibility')).toBe('visible');
            expect(styling.describe().knobs.find((knob) => knob.id === 'roads.exitNumbers')?.overridden).toBe(true);
        });

        test('minZoom moves the POI layer zoom range; zoomShift rewrites the density filter', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('pois.minZoom', 10);
            expect(mapLibre.setLayerZoomRange).toHaveBeenCalledWith('POI', 10, 24);

            styling.set('pois.zoomShift', 1);
            const filter = mapLibre.setFilter.mock.calls.find((call) => call[0] === 'POI')?.[1];
            expect(JSON.stringify(filter)).toContain('["-",["zoom"],2]');

            styling.reset('pois.zoomShift');
            const restored = mapLibre.setFilter.mock.lastCall?.[1];
            expect(JSON.stringify(restored)).toContain('["-",["zoom"],1]');
        });

        // `POIsModule.filterCategories` narrows the same layer. Both go through the shared filter
        // composer, so neither drops the other, whichever is applied last.
        test('zoomShift keeps the category clause another module put on the POI layer', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const categories: ExpressionFilterSpecification = ['==', ['get', 'category'], 'cafe'];
            LayerFilterComposer.for(tomtomMap).setClause('POI', 'pois.categories', categories);

            styling.set('pois.zoomShift', 1);
            const shifted = JSON.stringify(lastFilterSetFor(mapLibre, 'POI'));
            expect(shifted).toContain('["-",["zoom"],2]');
            expect(shifted).toContain(JSON.stringify(categories));

            // And the clause outlives the knob going back to what the style defines.
            styling.reset('pois.zoomShift');
            const restored = JSON.stringify(lastFilterSetFor(mapLibre, 'POI'));
            expect(restored).toContain('["-",["zoom"],1]');
            expect(restored).toContain(JSON.stringify(categories));
        });
    });

    describe('colour knobs', () => {
        test('recolours the congestion class and re-derives its outline as the same shade', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('traffic.flow.slowColor', 'hsl(200, 100%, 51%)');

            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Traffic - Slow flow', 'line-color')).toBe(
                'hsl(200, 100%, 51%)',
            );
            // The style's outline was 15 points darker and less saturated than the inner line.
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Traffic - Slow flow outline', 'line-color')).toBe(
                'hsl(200, 85%, 36%)',
            );
        });

        test('POI label colour replaces the per-category match and resets to it', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('pois.labelColor', '#ffffff');
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'POI', 'text-color')).toBe('#ffffff');

            styling.reset('pois.labelColor');
            const restored = lastValueSetFor(mapLibre.setPaintProperty, 'POI', 'text-color') as unknown[];
            expect(restored[0]).toBe('match');
        });
    });

    describe('view knobs (map-level)', () => {
        test('projection and sky default to what the style declares', async () => {
            const styling = await StylingModule.get(tomtomMap);
            expect(styling.get('view.projection')).toBe('mercator');
            expect(styling.get('view.sky')).toBe(false);
        });

        test('a globe with a sky: the sky is written with atmosphere, coloured by the colour knobs', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('view.projection', 'globe');
            expect(mapLibre.setProjection).toHaveBeenLastCalledWith({ type: 'globe' });
            expect(() => styling.set('view.projection', 'orthographic')).toThrow(RangeError);

            styling.set('view.sky', true);
            styling.set('view.skyColor', '#123456');
            const sky = mapLibre.setSky.mock.lastCall?.[0];
            expect(sky).toMatchObject({ 'sky-color': '#123456', 'horizon-color': '#ffffff', 'atmosphere-blend': 0.8 });

            styling.reset('view.sky');
            // No sky in the style: back to MapLibre's transparent default, spelled out.
            expect(mapLibre.setSky.mock.lastCall?.[0]).toMatchObject({
                'atmosphere-blend': 0,
                'sky-color': 'transparent',
            });
            styling.reset('view.projection');
            expect(mapLibre.setProjection).toHaveBeenLastCalledWith({ type: 'mercator' });
        });

        test('turning the sky off clears it over a style that ships one of its own', async () => {
            const withSky = makeMapLibreMock(orbisStreetLightLayers, fixtureSources, {
                'sky-color': '#88c6fc',
                'horizon-color': '#ffffff',
                'atmosphere-blend': 0.8,
            });
            const styling = await StylingModule.get(makeTomTomMapMock(withSky).tomtomMap);
            expect(styling.get('view.sky')).toBe(true);

            styling.set('view.sky', false);
            expect(withSky.setSky.mock.lastCall?.[0]).toMatchObject({
                'atmosphere-blend': 0,
                'sky-color': 'transparent',
            });
        });

        test('the sky follows the style light/dark theme, so a dark map gets no white horizon', async () => {
            const dark = makeTomTomMapMock(mapLibre);
            (dark.tomtomMap as { styleLightDarkTheme: string }).styleLightDarkTheme = 'dark';
            const styling = await StylingModule.get(dark.tomtomMap);

            styling.set('view.sky', true);
            expect(mapLibre.setSky.mock.lastCall?.[0]).toMatchObject({
                'sky-color': '#0a1626',
                'horizon-color': '#2b4a72',
                'fog-color': '#0a1626',
            });
            // `describe()` reports the same default it would apply, rather than the light one.
            expect(styling.get('view.horizonColor')).toBe('#2b4a72');
        });

        test('the space behind an unpainted container follows the theme, since nothing else fills it', async () => {
            const styling = await StylingModule.get(tomtomMap);
            // Applied on style load without being asked for, since nothing else paints behind the map.
            expect(mapLibre.container.style.backgroundColor).toBe('rgb(255, 255, 255)');

            styling.set('view.spaceColor', '#05070d');
            expect(mapLibre.container.style.backgroundColor).toBe('rgb(5, 7, 13)');

            // Reset falls back to the theme's own colour rather than leaving the page to show through.
            styling.reset('view.spaceColor');
            expect(mapLibre.container.style.backgroundColor).toBe('rgb(255, 255, 255)');
        });

        test('a background the page painted is the space default, and a reset gives it back', async () => {
            const painted = makeMapLibreMock(orbisStreetLightLayers);
            painted.container.style.backgroundColor = '#123456';
            const { tomtomMap: pageMap } = makeTomTomMapMock(painted);

            const styling = await StylingModule.get(pageMap);
            // Untouched on load, and reported as the knob's default the way a style's own value is.
            expect(painted.container.style.backgroundColor).toBe('rgb(18, 52, 86)');
            expect(styling.get('view.spaceColor')).toBe('rgb(18, 52, 86)');

            styling.set('view.spaceColor', '#05070d');
            expect(painted.container.style.backgroundColor).toBe('rgb(5, 7, 13)');

            styling.reset('view.spaceColor');
            expect(painted.container.style.backgroundColor).toBe('rgb(18, 52, 86)');
        });

        test('the page background survives a style change, which must not re-capture our own paint', async () => {
            const painted = makeMapLibreMock(orbisStreetLightLayers);
            painted.container.style.backgroundColor = '#123456';
            const { tomtomMap: pageMap, styleChangeHandlers: handlers } = makeTomTomMapMock(painted);
            const styling = await StylingModule.get(pageMap);

            styling.set('view.spaceColor', '#05070d');
            const stylingHandler = stylingHandlerIn(handlers);
            expect(stylingHandler).toBeDefined();
            stylingHandler?.onStyleAboutToChange?.({ resetState: false });
            stylingHandler?.onStyleChanged?.({ resetState: false });
            // The style change re-ran the module's own restore, which is what could re-capture.
            expect(painted.container.style.backgroundColor).toBe('rgb(5, 7, 13)');

            // Had the capture run again it would have read '#05070d' and reset would never come back.
            styling.reset('view.spaceColor');
            expect(painted.container.style.backgroundColor).toBe('rgb(18, 52, 86)');
        });
    });

    describe('map colours', () => {
        test('defaults are the style’s own base literals, read off the anchor layers', async () => {
            const styling = await StylingModule.get(tomtomMap);
            expect(styling.get('colors.roadMajor')).toBe('hsl(47, 100%, 55%)');
            expect(styling.get('colors.water')).toBe('hsl(196, 80%, 73%)');
            expect(styling.get('colors.label')).toBe('hsl(0, 0%, 10%)');
            expect(styling.get('colors.land')).toBe('hsl(45, 35%, 92%)');
            for (const name of mapColorNames) {
                expect(styling.describe().knobs.find((knob) => knob.id === `colors.${name}`)?.available).toBe(true);
            }
        });

        test('setMapColors recolours the whole road class family and keeps shade relationships', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.setMapColors({ roadMajor: 'hsl(200, 100%, 55%)' });

            const line = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'Surface - Motorway & Trunk', 'line-color'),
            );
            expect(line).toContain('hsl(200, 100%, 55%)'); // motorway
            expect(line).toContain('hsl(200, 92%, 63%)'); // trunk: same offset as the style's
            // The restricted-access grey is re-derived too, but a 0%-saturation shade stays grey.
            expect(line).toMatch(/hsl\(\d+, 0%, 91%\)/);
            // The outline is a darker shade of the same base, re-derived by its own offset.
            const outline = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'Surface - Motorway & Trunk outline', 'line-color'),
            );
            expect(outline).toContain('hsl(200, 83%, 35%)');
            // Tunnels draw every class in one expression: only the major branches moved.
            const tunnel = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'Tunnel - Road line', 'line-color'),
            );
            expect(tunnel).toContain('hsl(200,');
            // Secondary roads belong to `road`, not `roadMajor`.
            expect(valuesSetFor(mapLibre.setPaintProperty, 'Surface - Secondary road', 'line-color')).toHaveLength(0);
            expect(styling.getConfig()).toStrictEqual({ 'colors.roadMajor': 'hsl(200, 100%, 55%)' });
        });

        test('two colours meeting in one expression compose, and reset restores the style', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.setMapColors({ roadMajor: 'hsl(200, 100%, 55%)', road: 'hsl(300, 20%, 60%)' });
            const tunnel = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'Tunnel - Road line', 'line-color'),
            );
            expect(tunnel).toContain('hsl(200,');
            expect(tunnel).toContain('hsl(300,');

            styling.reset('colors.road');
            const partlyRestored = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'Tunnel - Road line', 'line-color'),
            );
            expect(partlyRestored).toContain('hsl(200,');
            expect(partlyRestored).not.toContain('hsl(300,');

            styling.reset();
            const originalLayer = orbisStreetLightLayers.find((layer) => layer.id === 'Tunnel - Road line') as {
                paint: Record<string, unknown>;
            };
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Tunnel - Road line', 'line-color')).toStrictEqual(
                originalLayer.paint['line-color'],
            );
        });

        test('land reaches the ground the background never shows through', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.setMapColors({ land: 'hsl(120, 50%, 50%)' });

            // The greens in the landcover expression stay `vegetation`'s; only the earth tones move.
            const landcover = JSON.stringify(
                lastValueSetFor(mapLibre.setPaintProperty, 'LULC - Landcover', 'fill-color'),
            );
            expect(landcover).toContain('hsl(110, 45%, 75%)');
            expect(landcover).toContain('hsl(120,');
        });

        test('artificial reaches the man-made surfaces laid over the ground', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.setMapColors({ artificial: 'hsl(120, 50%, 50%)' });

            // Each surface keeps its own offset from the built-up anchor, so it lands in the new
            // colour's hue family rather than exactly on it.
            for (const layerId of ['Structure - Bridge & Pier area', 'Areas - Pedestrian']) {
                const recoloured = JSON.stringify(lastValueSetFor(mapLibre.setPaintProperty, layerId, 'fill-color'));
                const hues = [...recoloured.matchAll(/hsla?\((\d+),/g)].map(([, hue]) => Number(hue));
                expect(hues).not.toHaveLength(0);
                for (const hue of hues) expect(Math.abs(hue - 120)).toBeLessThanOrEqual(40);
            }
        });

        test('water and labels reach their derived layers; unknown names and non-colours are refused', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.setMapColors({ water: '#ff0000', label: '#00ff00' });
            expect(JSON.stringify(lastValueSetFor(mapLibre.setPaintProperty, 'Water - Fill', 'fill-color'))).toContain(
                'hsl(0,',
            );
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Water - Line', 'line-color')).toMatch(/^hsl\(0, /);
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Places - City', 'text-color')).toMatch(/^hsl\(120, /);
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Borders - Country', 'line-color')).toMatch(
                /^hsl\(120, /,
            );
            expect(() => styling.setMapColors({ sky: '#fff' } as never)).toThrow(/Unknown map colour/);
            expect(() => styling.setMapColors({ water: 'wet' })).toThrow(RangeError);
        });

        test('exportStyle returns the rendered style as a specification', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const exported = styling.exportStyle();
            expect(exported.layers).toHaveLength(orbisStreetLightLayers.length);
            expect(exported.layers).not.toBe(mapLibre.state.layers);
        });
    });

    describe('hillshade appearance and base-map group toggles', () => {
        test('hillshade knobs set the shading paint literals and lift the zoom cap', async () => {
            const styling = await StylingModule.get(tomtomMap);
            expect(styling.get('hillshade.method')).toBe('standard');
            expect(styling.get('hillshade.maxZoom')).toBe(13);

            styling.set('hillshade.method', 'multidirectional');
            styling.set('hillshade.shadowColor', '#112233');
            styling.set('hillshade.exaggeration', 0.6);
            styling.set('hillshade.maxZoom', 22);
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Hillshade', 'hillshade-method')).toBe(
                'multidirectional',
            );
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Hillshade', 'hillshade-shadow-color')).toBe('#112233');
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'Hillshade', 'hillshade-exaggeration')).toBe(0.6);
            expect(mapLibre.setLayerZoomRange).toHaveBeenLastCalledWith('Hillshade', 0, 22);

            styling.reset('hillshade.exaggeration');
            const restored = lastValueSetFor(
                mapLibre.setPaintProperty,
                'Hillshade',
                'hillshade-exaggeration',
            ) as unknown[];
            expect(restored[0]).toBe('interpolate');
            expect(() => styling.set('hillshade.method', 'fancy' as never)).toThrow(RangeError);
        });

        test('every base-map layer group is a toggle with the group’s shipped visibility as default', async () => {
            const styling = await StylingModule.get(tomtomMap);
            // The building groups are the `buildings.*` knobs, so they have no `basemap.*` twin that
            // could disagree with them about what is shown.
            const ids = styling.describe().knobs.map((knob) => knob.id);
            expect(ids).not.toContain('basemap.buildings2D');
            expect(ids).not.toContain('basemap.buildings3D');
            expect(ids).toEqual(expect.arrayContaining(['buildings.footprints', 'buildings.3d']));
            expect(styling.get('basemap.water')).toBe(true);
            styling.set('basemap.railways', false);
            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'Surface - Railway outline', 'visibility')).toBe('none');
            expect(valuesSetFor(mapLibre.setLayoutProperty, 'Surface - Motorway & Trunk', 'visibility')).toHaveLength(
                0,
            );
        });
    });

    describe('advanced layer API', () => {
        test('raw overrides land on top of the knobs and are re-applied after a style change', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('labels.sizeFactor', 1.2);
            styling.layers.query({ group: 'roadLabels' }).setPaint({ 'text-color': '#93c5fd' });
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'TransitLabels - Road', 'text-color')).toBe('#93c5fd');
            // Not a setting: the override is an edit to this style, not portable configuration.
            expect(styling.getConfig()).toStrictEqual({ 'labels.sizeFactor': 1.2 });

            mapLibre.setPaintProperty.mockClear();
            stylingHandlerIn(styleChangeHandlers)?.onStyleChanged?.({ resetState: false });
            expect(lastValueSetFor(mapLibre.setPaintProperty, 'TransitLabels - Road', 'text-color')).toBe('#93c5fd');

            // A clean switch drops it with everything else.
            mapLibre.setPaintProperty.mockClear();
            stylingHandlerIn(styleChangeHandlers)?.onStyleChanged?.({ resetState: true });
            expect(valuesSetFor(mapLibre.setPaintProperty, 'TransitLabels - Road', 'text-color')).toHaveLength(0);
        });
    });

    describe('presets', () => {
        test('applyPreset replaces the settings by default and merges on request', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('traffic.flow.widthFactor', 1.8);

            styling.applyPreset('data-viz');
            const settings = styling.getConfig() ?? {};
            expect(settings['roads.exitNumbers']).toBe(false);
            expect(settings['traffic.flow.widthFactor']).toBeUndefined();
            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'TransitLabels - Exit Number', 'visibility')).toBe(
                'none',
            );

            styling.applyPreset('globe', { merge: true });
            expect(styling.getConfig()).toMatchObject({ 'roads.exitNumbers': false, 'view.projection': 'globe' });
            expect(mapLibre.setProjection).toHaveBeenLastCalledWith({ type: 'globe' });
            expect(() => styling.applyPreset('vaporwave' as never)).toThrow(/Unknown styling preset/);
        });
    });

    describe('settings and lifecycle', () => {
        test('getConfig is a serializable snapshot that applyConfig replays; config-change fires', async () => {
            const styling = await StylingModule.get(tomtomMap);
            const changes: unknown[] = [];
            styling.events.on('config-change', (settings) => {
                changes.push(settings);
            });

            styling.set('labels.sizeFactor', 1.2);
            styling.set('roads.shields', false);
            const saved = structuredClone(styling.getConfig());
            expect(saved).toStrictEqual({ 'labels.sizeFactor': 1.2, 'roads.shields': false });
            expect(knobSettings(styling.describe().knobs)).toStrictEqual(saved);

            styling.resetConfig();
            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'TransitLabels - Route Shield 1', 'visibility')).toBe(
                'visible',
            );

            styling.applyConfig(saved);
            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'TransitLabels - Route Shield 1', 'visibility')).toBe(
                'none',
            );
            expect(changes).toHaveLength(4);
        });

        test('re-applies its settings after a style change and drops them on a clean switch', async () => {
            const styling = await StylingModule.get(tomtomMap);
            styling.set('roads.exitNumbers', false);
            mapLibre.setLayoutProperty.mockClear();

            // The module registered after the map's data modules would: it must land last.
            const stylingHandler = stylingHandlerIn(styleChangeHandlers);
            expect(stylingHandler).toBeDefined();

            stylingHandler?.onStyleAboutToChange?.({ resetState: false });
            stylingHandler?.onStyleChanged?.({ resetState: false });
            expect(lastValueSetFor(mapLibre.setLayoutProperty, 'TransitLabels - Exit Number', 'visibility')).toBe(
                'none',
            );
            expect(styling.getConfig()).toStrictEqual({ 'roads.exitNumbers': false });

            stylingHandler?.onStyleChanged?.({ resetState: true });
            expect(styling.getConfig()).toBeUndefined();
        });

        test('warns once per knob that matches nothing in a foreign style, and stays usable', async () => {
            const customStyleMap = makeMapLibreMock(
                [
                    { id: 'bg', type: 'background', paint: { 'background-color': '#000' } },
                    { id: 'names', type: 'symbol', source: 'mine', layout: { 'text-field': ['get', 'n'] } },
                ] as LayerSpecification[],
                { mine: { type: 'vector' } },
            );
            const styling = await StylingModule.get(makeTomTomMapMock(customStyleMap).tomtomMap);

            const unreached = styling.describe().knobs.filter((knob) => !knob.available);
            const unreachedIds = unreached.map((knob) => knob.id);
            // Transforms and map-level view knobs still apply; curated tables do not.
            expect(unreachedIds).not.toContain('labels.sizeFactor');
            expect(unreachedIds).not.toContain('view.projection');
            expect(unreachedIds).toContain('roads.exitNumbers');
            expect(warn).toHaveBeenCalledTimes(unreached.length);
            // The one transform that still applies: the custom style's own labels.
            styling.set('labels.sizeFactor', 1.5);
            expect(lastValueSetFor(customStyleMap.setLayoutProperty, 'names', 'text-size')).toBe(24);
            // A curated knob with nothing to reach is a no-op, not an error.
            expect(() => styling.set('roads.exitNumbers', false)).not.toThrow();
        });

        test('names what it cannot scale, and leaves the style value as it is', async () => {
            const customStyleMap = makeMapLibreMock(
                [
                    {
                        id: 'names',
                        type: 'symbol',
                        source: 'mine',
                        // Zoom sits where no `["*", factor, …]` wrapper may go.
                        layout: { 'text-field': ['get', 'n'], 'text-size': ['-', ['zoom'], 1] },
                    },
                ] as LayerSpecification[],
                { mine: { type: 'vector' } },
            );
            const styling = await StylingModule.get(makeTomTomMapMock(customStyleMap).tomtomMap);
            warn.mockClear();

            styling.set('labels.sizeFactor', 1.5);

            expect(valuesSetFor(customStyleMap.setLayoutProperty, 'names', 'text-size')).toStrictEqual([]);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.lastCall?.[0]).toContain(
                "cannot scale 'text-size' of layer 'names': the style gives it a value this knob cannot scale",
            );
        });
    });
});
