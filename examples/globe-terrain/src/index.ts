import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { StylingModule, TerrainModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        style: 'standardDark',
        mapLibre: {
            container: 'sdk-map',
            center: [10, 30],
            zoom: 2,
            // MapLibre's terrain fog only shows past pitch 60, its default maxPitch.
            maxPitch: 75,
        },
    });

    const globe = document.querySelector('#ui-globe') as HTMLInputElement;
    const sky = document.querySelector('#ui-sky') as HTMLInputElement;
    const terrain = document.querySelector('#ui-terrain') as HTMLInputElement;
    const exaggeration = document.querySelector('#ui-exaggeration') as HTMLInputElement;
    const exaggerationValue = document.querySelector('#ui-exaggerationValue') as HTMLElement;

    const [styling, terrainModule] = await Promise.all([
        StylingModule.get(map, { 'view.projection': 'globe', 'view.sky': true }),
        TerrainModule.get(map, { elevationExaggeration: Number(exaggeration.value) }),
    ]);

    globe.addEventListener('change', () => styling.set('view.projection', globe.checked ? 'globe' : 'mercator'));
    sky.addEventListener('change', () => styling.set('view.sky', sky.checked));
    terrain.addEventListener('change', () => terrainModule.setElevationEnabled(terrain.checked));
    exaggeration.addEventListener('input', () => {
        exaggerationValue.textContent = exaggeration.value;
        terrainModule.setElevationExaggeration(Number(exaggeration.value));
    });

    // Terrain needs a close, tilted camera to show.
    document.querySelector('#ui-flyToAlps')?.addEventListener('click', () => {
        terrain.checked = true;
        terrainModule.setElevationEnabled(true);
        map.mapLibreMap.flyTo({ center: [7.66, 45.98], zoom: 12.5, pitch: 70, bearing: 20, duration: 4000 });
    });

    initTogglePanel();
})();
