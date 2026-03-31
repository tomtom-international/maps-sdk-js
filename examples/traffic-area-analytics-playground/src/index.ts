import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorTheme, AreaAnalyticsMetricKey, AreaAnalyticsMode } from '@tomtom-org/maps-sdk/map';
import { BaseMapModule, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { initCitySearch } from './citySearch';
import { API_KEY } from './config';
import { updateLegend, wireRadioGroup } from './controls';
import { initTogglePanel } from './togglePanel';
import { initTooltip } from './tooltip';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    // Wait one frame for Vite's CSS injection to apply before creating the map
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-3.7038, 40.4168], zoom: 12, pitch: 45, bearing: -17 },
    });

    const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
        displayMode: 'hexgrid-3d',
        metric: 'congestionLevel',
    });

    const $ = (id: string) => document.getElementById(id) as HTMLElement;

    const { selectCityByName } = initCitySearch({
        map,
        analyticsModule,
        cityInput: $('city-input') as HTMLInputElement,
        suggestionsList: $('city-suggestions') as HTMLUListElement,
        bottomPanel: $('bottom-panel'),
        loadingOverlay: $('loading-overlay'),
        heatmapCanvas: $('heatmap-canvas') as HTMLCanvasElement,
    });

    const cityLabelsMap = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'include', names: ['cityLabels', 'capitalLabels'] },
    });

    cityLabelsMap.events.on('click', async (feature, lngLat) => {
        const cityName = feature.properties.name as string | undefined;

        if (cityName) {
            await selectCityByName(cityName, lngLat.toArray());
        }
    });

    const restOfTheMap = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'exclude', names: ['cityLabels', 'capitalLabels'] },
        events: { cursorOnHover: 'default' },
    });

    restOfTheMap.events.on('click', () => {
        analyticsModule.clear();
        $('bottom-panel').classList.add('aa-hidden');
    });

    wireRadioGroup('#metric-selector', (value) => {
        analyticsModule.setMetric(value as AreaAnalyticsMetricKey);
        const color = analyticsModule.getConfig()?.color;
        updateLegend(value as AreaAnalyticsMetricKey, typeof color === 'string' ? color : undefined);
    });

    (document.getElementById('mode-selector') as HTMLSelectElement).addEventListener('change', (e) => {
        analyticsModule.setMode((e.target as HTMLSelectElement).value as AreaAnalyticsMode);
    });

    wireRadioGroup('#color-scheme-selector', (value) => {
        const color = value as AreaAnalyticsColorTheme;
        analyticsModule.setColor(color);
        updateLegend(analyticsModule.getConfig()?.metric ?? 'congestionLevel', color);
    });

    initTooltip(map, analyticsModule);
    initTogglePanel();
})();
