import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type {
    AreaAnalyticsColorStop,
    AreaAnalyticsColorTheme,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMode,
} from '@tomtom-org/maps-sdk/map';
import { COLOR_SCHEMES, mapStyleLayerIDs, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import { initColorStops } from './colorStops';
import { API_KEY, MOVE_PORTAL_KEY } from './config';
import { initMapControls } from './mapControls';
import { initTogglePanel } from './togglePanel';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

let currentMetric: AreaAnalyticsMetricKey = 'congestionLevel';

// Per-metric initial color stops with breakpoints tuned for urban traffic.
// congestionLevel: 0–100 %, speed: 0–120 km/h (auto-inverted), travelTime: 0–20 s/km.
const INITIAL_COLOR: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>> = {
    congestionLevel: [
        { value: 0, color: '#2dc653' }, // 0 %   — free flow
        { value: 0.3, color: '#f5a623' }, // 30 %  — moderate congestion
        { value: 1, color: '#e03030' }, // 100 % — severe congestion
    ],
    speed: [
        { value: 0, color: '#2dc653' }, // 0 km/h   — auto-inverted in rendering → red
        { value: 0.33, color: '#f5a623' }, // ~40 km/h — urban speed threshold
        { value: 1, color: '#e03030' }, // 120 km/h — auto-inverted in rendering → green
    ],
    travelTime: [
        { value: 0, color: '#2dc653' }, // 0 s/km  — fast
        { value: 0.6, color: '#f5a623' }, // 12 s/km — moderate delay
        { value: 1, color: '#e03030' }, // 20 s/km — heavy delay
    ],
};

let currentColorConfig: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>> = { ...INITIAL_COLOR };

function pastDateRange(): { startDate: string } {
    const start = new Date();
    start.setDate(start.getDate() - 9);
    return { startDate: start.toISOString().slice(0, 10) };
}

function wireSegmentedGroup(selector: string, onChange: (value: string) => void): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(`${selector} .sdk-example-toggle`);
    for (const btn of buttons) {
        btn.addEventListener('click', () => {
            for (const b of buttons) b.classList.remove('active');
            btn.classList.add('active');
            if (btn.dataset.value) onChange(btn.dataset.value);
        });
    }
}

function initBeforeLayerSelect(analyticsModule: TrafficAreaAnalyticsModule): void {
    const select = document.getElementById('before-layer-selector') as HTMLSelectElement;
    select.add(new Option('Above all layers', 'top'));
    for (const key of Object.keys(mapStyleLayerIDs) as (keyof typeof mapStyleLayerIDs)[]) {
        select.add(new Option(key, key));
        if (key === 'lowestLabel') select.options[select.options.length - 1].selected = true;
    }
    select.addEventListener('change', () => {
        const value = select.value as 'top' | keyof typeof mapStyleLayerIDs;
        analyticsModule.moveBeforeLayer({
            heatmap: value,
            hexgrid: { flat2D: value, extrusion3D: value },
            square: { flat2D: value, extrusion3D: value },
        });
    });
}

(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const loadingOverlay = document.getElementById('loading-overlay')!;
    loadingOverlay.classList.remove('aa-hidden');

    const cityName = 'Amsterdam, Netherlands';
    const place = await geocodeOne(cityName);

    // Init map immediately so it loads while analytics are being fetched
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', bounds: place.bbox, fitBoundsOptions: { padding: 40, pitch: 45 } },
    });

    // Fetch geometry then kick off analytics — runs in parallel with map initialization
    const analyticsPromise = geometryData({ geometries: [place] })
        .then(({ features }) => features[0].geometry)
        .then((geometry) =>
            trafficAreaAnalytics({
                apiKey: MOVE_PORTAL_KEY,
                name: cityName,
                ...pastDateRange(),
                dataTypes: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME'],
                functionalRoadClasses: 'all',
                hours: 'all',
                geometry,
            }),
        );

    const [analyticsModule, analytics] = await Promise.all([
        TrafficAreaAnalyticsModule.get(map, {
            displayMode: 'hexgrid-3d',
            metric: 'congestionLevel',
            color: INITIAL_COLOR,
        }),
        analyticsPromise,
    ]).finally(() => loadingOverlay.classList.add('aa-hidden'));

    await analyticsModule.show(analytics);

    initMapControls(map);
    initTogglePanel();

    const colorStopsControls = initColorStops(
        'color-stops-list',
        'add-stop-btn',
        INITIAL_COLOR.congestionLevel!,
        (stops) => {
            currentColorConfig = { ...currentColorConfig, [currentMetric]: stops };
            analyticsModule.setColor(currentColorConfig);
        },
    );

    wireSegmentedGroup('#metric-selector', (value) => {
        currentMetric = value as AreaAnalyticsMetricKey;
        analyticsModule.setMetric(currentMetric);
        colorStopsControls.update(currentColorConfig[currentMetric] ?? COLOR_SCHEMES['congestion']);
    });

    (document.getElementById('mode-selector') as HTMLSelectElement).addEventListener('change', (e) =>
        analyticsModule.setMode((e.target as HTMLSelectElement).value as AreaAnalyticsMode),
    );

    wireSegmentedGroup('#color-theme-selector', (value) => {
        const presetStops = COLOR_SCHEMES[value as AreaAnalyticsColorTheme];
        currentColorConfig = { ...currentColorConfig, [currentMetric]: presetStops };
        colorStopsControls.update(presetStops);
        analyticsModule.setColor(currentColorConfig);
    });

    initBeforeLayerSelect(analyticsModule);
})();
