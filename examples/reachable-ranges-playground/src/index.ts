import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    PlacesModule,
    ReachableRangesModule,
    reachableRangesKnobCatalogue,
    StylingFoundationsModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import { mapColorsLightDark } from '@tomtom-org/maps-sdk-plugin-map-theme';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { initKnobPanel } from './knobPanel';
import { themes } from './themes';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const stations: { name: string; position: [number, number] }[] = [
    { name: 'Amsterdam Centraal', position: [4.9003, 52.3791] },
    { name: 'Utrecht Centraal', position: [5.1109, 52.0894] },
];
const minutes = [10, 20, 30];

// Band colours of your own, innermost first. The empty list leaves them to the map's colours.
const palettes: Record<string, string[]> = {
    'From the map': [],
    Sunset: ['#b3001b', '#e85d04', '#faa307'],
    Ocean: ['#03045e', '#0077b6', '#00b4d8'],
    Forest: ['#1b4332', '#40916c', '#95d5b2'],
};

(async () => {
    const map = new TomTomMap({
        style: 'streetLight',
        mapLibre: { container: 'sdk-map', center: [5.0, 52.24], zoom: 9 },
    });
    const styling = await StylingFoundationsModule.get(map);

    // Every station's budgets in one request and one show: the module nests each station's bands,
    // titles them from their budgets and, left to the map, ramps them from its accent to its land.
    const ranges = await calculateReachableRanges(
        stations.flatMap(({ position }) =>
            minutes.map((value) => ({ origin: position, budget: { type: 'timeMinutes' as const, value } })),
        ),
    );
    const rangesModule = await ReachableRangesModule.create(map);
    rangesModule.show(ranges);
    if (ranges.bbox)
        map.mapLibreMap.fitBounds(ranges.bbox as LngLatBoundsLike, {
            padding: { top: 60, bottom: 60, left: 60, right: 360 },
        });

    const pins = await PlacesModule.create(map);
    await pins.show(
        stations.map(({ name, position }) => ({
            type: 'Feature',
            id: name,
            geometry: { type: 'Point', coordinates: position },
            properties: { type: 'POI', address: { freeformAddress: name } },
        })),
    );

    initKnobPanel('ui-knobs', reachableRangesKnobCatalogue, rangesModule, palettes);

    // Theming sets the map's colours, accent and land among them, and the bands repaint on their own.
    const themeSelector = document.querySelector('#ui-theme') as HTMLSelectElement;
    themeSelector.append(...Object.keys(themes).map((name) => new Option(name, name)));
    themeSelector.addEventListener('change', async () => {
        const colors = themes[themeSelector.value];
        const lightDark = colors ? mapColorsLightDark(colors) : 'light';
        if (lightDark !== map.styleLightDarkTheme) {
            await map.setStyle(lightDark === 'dark' ? 'streetDark' : 'streetLight');
        }
        if (colors) styling.setMapColors(colors);
        else styling.resetConfig();
    });

    const toggle = document.querySelector('.ui-heading-toggle');
    const content = document.querySelector('.ui-panel-content');
    toggle?.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        content?.classList.toggle('collapsed');
    });
})();
