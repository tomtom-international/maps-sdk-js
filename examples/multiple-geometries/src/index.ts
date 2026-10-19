import type { BBox, Places } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    calculateFittingBBox,
    GeometriesModule,
    type GeometriesModuleConfig,
    type GeometryBeforeLayerConfig,
    type GeometryPaletteMode,
    geometriesKnobCatalogue,
    knobEntryOf,
    type StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import type { Config } from './placeConfiguration';
import { namedConfigs, palettes } from './placeConfiguration';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const OWN_PALETTE = "The region's own";

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
        },
    });
    const geometryModule = await GeometriesModule.create(map);
    let placeSubdivisions: Places;
    let region: Config;

    // The palette mode select lists the knob's catalogue options, with its description as the tooltip.
    const paletteSelector = document.getElementById('ui-palette') as HTMLSelectElement;
    const paletteModeSelector = document.getElementById('ui-paletteMode') as HTMLSelectElement;
    const paletteModeKnob = knobEntryOf(geometriesKnobCatalogue, 'fill.paletteMode');
    [OWN_PALETTE, ...Object.keys(palettes)].forEach((name) => paletteSelector.add(new Option(name)));
    paletteModeKnob.options?.forEach((mode) => paletteModeSelector.add(new Option(mode)));
    paletteModeSelector.title = paletteModeKnob.description;

    // The region's fill, in the palette mode picked here. A palette picked here takes the place of the
    // region's own, and of its single `fill.color` too.
    const fillConfig = (): GeometriesModuleConfig['fill'] => {
        const fill = region.geometryConfig.fill;
        const palette = palettes[paletteSelector.value];
        const paletteMode = paletteModeSelector.value as GeometryPaletteMode;
        return palette ? { opacity: fill?.opacity, palette, paletteMode } : { ...fill, paletteMode };
    };
    const applyPalette = () => geometryModule.updateConfig({ fill: fillConfig() });

    const placeBBox = () =>
        calculateFittingBBox({
            map,
            toBeContainedBBox: placeSubdivisions.bbox as BBox,
            surroundingElements: ['#ui-panel'],
        }) as LngLatBoundsLike;

    const updateMap = async (config: Config) => {
        region = config;
        paletteSelector.value = OWN_PALETTE;
        paletteModeSelector.value = config.geometryConfig.fill?.paletteMode ?? String(paletteModeKnob.default);
        placeSubdivisions = await geocode({ limit: 100, query: '', ...config.searchConfig });
        map.mapLibreMap.fitBounds(placeBBox());
        const geometries = await geometryData({ geometries: placeSubdivisions, zoom: 14 });
        geometryModule.applyConfig({ ...config.geometryConfig, fill: fillConfig() });
        geometryModule.show(geometries);
    };

    const listenToUIEvents = async () => {
        const placeSelector = document.getElementById('ui-placeSelector') as HTMLSelectElement;
        placeSelector.addEventListener('change', (event) =>
            updateMap(namedConfigs[(event.target as HTMLInputElement).value]),
        );
        paletteSelector.addEventListener('change', applyPalette);
        paletteModeSelector.addEventListener('change', applyPalette);

        const options = document.querySelectorAll<HTMLInputElement>('input[type=radio][name=layerOption]');
        options.forEach((option) => {
            option.addEventListener('change', () =>
                geometryModule.updateConfig({ beforeLayerConfig: option.value as GeometryBeforeLayerConfig }),
            );
        });

        const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
        standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
        stylesSelector.addEventListener('change', (event) =>
            map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
        );

        document
            .querySelector('#ui-reCenter')
            ?.addEventListener('click', () => placeSubdivisions && map.mapLibreMap.fitBounds(placeBBox()));
    };

    await updateMap(namedConfigs.france);
    await listenToUIEvents();

    initTogglePanel();
})();
