import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type {
    AreaAnalyticsColorStopsConfig,
    AreaAnalyticsColorTheme,
    AreaAnalyticsDisplayMode,
} from '@tomtom-org/maps-sdk/map';
import { BaseMapModule, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { API_KEY } from './config';
import { updateLegend } from './controls';
import { initCitySearch } from './loadAnalytics';
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
        activeMetric: 'congestionLevel',
    });

    const $ = (id: string) => document.getElementById(id) as HTMLElement;

    const { selectCityByName, rerenderChart } = initCitySearch({
        map,
        analyticsModule,
        cityInput: $('city-input') as HTMLInputElement,
        suggestionsList: $('city-suggestions') as HTMLUListElement,
        bottomPanel: $('bottom-panel'),
        loadingOverlay: $('loading-overlay'),
        heatmapContainer: $('heatmap-chart'),
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

    (document.getElementById('metric-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        const metricKey = (event.target as HTMLSelectElement).value as AreaAnalyticsMetricKey;
        analyticsModule.setMetric(metricKey);
        const metricColor = analyticsModule.getConfig()?.metricConfig?.[metricKey]?.color as
            | AreaAnalyticsColorStopsConfig
            | undefined;
        updateLegend(metricKey, metricColor);
    });

    (document.getElementById('mode-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        analyticsModule.setMode((event.target as HTMLSelectElement).value as AreaAnalyticsDisplayMode);
    });

    (document.getElementById('color-scheme-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        const color = (event.target as HTMLSelectElement).value as AreaAnalyticsColorTheme;
        analyticsModule.setColor(color);
        const metricKey = analyticsModule.getConfig()?.activeMetric ?? 'congestionLevel';
        const metricColor = analyticsModule.getConfig()?.metricConfig?.[metricKey]?.color as
            | AreaAnalyticsColorStopsConfig
            | undefined;
        updateLegend(metricKey, metricColor);
        rerenderChart();
    });

    initTooltip(map, analyticsModule);
    initTogglePanel();
})();
