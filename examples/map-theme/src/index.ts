import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    PlacesModule,
    RoutingModule,
    StylingFoundationsModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute } from '@tomtom-org/maps-sdk/services';
import { mapColorsLightDark, mapThemeModes } from '@tomtom-org/maps-sdk-plugin-map-theme';
import './style.css';
import { API_KEY } from './config';
import { ileDeLaCite, landmarks, louvre, pantheon } from './overlays';
import { type Derive, initSources } from './sources';
import { showSwatches } from './swatches';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', center: [2.3527, 48.8527], zoom: 14 } });
    const styling = await StylingFoundationsModule.get(map);

    // Neither the area, the pins nor the route pick a colour of their own, so all three draw in the
    // theme's `accent` and follow it on every change.
    const geometries = await GeometriesModule.create(map);
    await geometries.show(ileDeLaCite);
    const places = await PlacesModule.create(map);
    await places.show(landmarks);
    const routing = await RoutingModule.create(map);
    await routing.showRoutes(await calculateRoute({ locations: [louvre, pantheon] }));

    const modeSelector = document.querySelector('#ui-mode') as HTMLSelectElement;
    const swatches = document.querySelector('#ui-swatches') as HTMLElement;

    // What the map was last themed from, so switching light/dark re-themes the same source.
    let current: Derive | undefined;

    // Deriving throws on colours it cannot parse and on files it cannot read; show that instead.
    const themeMap = async (derive: Derive) => {
        current = derive;
        const mode = mapThemeModes.find((candidate) => candidate === modeSelector.value) ?? 'auto';
        try {
            const colors = await derive(mode);
            // A dark theme recolours a dark style, whose own shades then stay in range.
            const lightDark = mapColorsLightDark(colors);
            if (lightDark !== map.styleLightDarkTheme) {
                await map.setStyle(lightDark === 'dark' ? 'streetDark' : 'streetLight');
            }
            styling.setMapColors(colors);
            showSwatches(swatches, colors);
        } catch (error) {
            swatches.textContent = error instanceof Error ? error.message : String(error);
        }
    };

    modeSelector.addEventListener('change', () => current && themeMap(current));
    initSources(themeMap);
    initTogglePanel();
})();
