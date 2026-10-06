import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsDisplayMode, AreaAnalyticsPalette, BaseMapLayerGroupName } from '@tomtom-org/maps-sdk/map';
import { BaseMapModule, resolveColorStops, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { API_KEY } from './config';
import { updateLegend } from './controls';
import { defaultFilters, initFilters } from './filters';
import { initCitySearch } from './loadAnalytics';
import { initCellSelection } from './selection';
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

    const analyticsModule = await TrafficAreaAnalyticsModule.create(map, {
        displayMode: 'hexgrid-3d',
        activeMetric: 'congestionLevel',
    });

    const $ = (id: string) => document.getElementById(id) as HTMLElement;

    const refreshLegend = (metricKey: AreaAnalyticsMetricKey): void =>
        updateLegend(metricKey, resolveColorStops(metricKey, analyticsModule.getConfig()?.metrics?.[metricKey]));

    const filters = defaultFilters();
    const applyButton = $('filter-apply') as HTMLButtonElement;

    const { selectCityByName, rerenderChart, reloadCurrent, hasCurrent } = initCitySearch({
        map,
        analyticsModule,
        cityInput: $('city-input') as HTMLInputElement,
        suggestionsList: $('city-suggestions') as HTMLUListElement,
        bottomPanel: $('bottom-panel'),
        loadingOverlay: $('loading-overlay'),
        heatmapContainer: $('heatmap-chart'),
        filters,
    });

    const filterControls = initFilters(filters, () => {
        applyButton.disabled = !hasCurrent() || !filterControls.isValid();
    });

    applyButton.addEventListener('click', async () => {
        if (!hasCurrent() || !filterControls.isValid()) return;
        applyButton.disabled = true;
        await reloadCurrent();
    });

    const baseMap = await BaseMapModule.get(map);
    const cityLabelGroups: BaseMapLayerGroupName[] = ['cityLabels', 'capitalLabels'];

    baseMap.events
        .where({ layerGroups: { show: 'only', values: cityLabelGroups } })
        .on('click', async (feature, lngLat) => {
            const cityName = feature.properties.name as string | undefined;

            if (cityName) {
                await selectCityByName(cityName, lngLat.toArray());
            }
        });

    baseMap.events
        .where({ layerGroups: { show: 'all-except', values: cityLabelGroups } }, { cursorOnHover: 'default' })
        .on('click', () => {
            analyticsModule.clear();
            $('bottom-panel').classList.add('aa-hidden');
        });

    (document.getElementById('metric-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        const metricKey = (event.target as HTMLSelectElement).value as AreaAnalyticsMetricKey;
        analyticsModule.updateConfig({ activeMetric: metricKey });
        refreshLegend(metricKey);
    });

    (document.getElementById('mode-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        analyticsModule.updateConfig({
            displayMode: (event.target as HTMLSelectElement).value as AreaAnalyticsDisplayMode,
        });
    });

    (document.getElementById('palette-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        analyticsModule.setPalette((event.target as HTMLSelectElement).value as AreaAnalyticsPalette);
        refreshLegend(analyticsModule.getConfig()?.activeMetric ?? 'congestionLevel');
        rerenderChart();
    });

    initTooltip(map, analyticsModule);
    initCellSelection(map, analyticsModule, $('busiest-cell') as HTMLButtonElement);
    initTogglePanel();
})();
