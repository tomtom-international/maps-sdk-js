import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type {
    AreaAnalyticsColorStop,
    AreaAnalyticsColorTheme,
    AreaAnalyticsDisplayMode,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsValueType,
} from '@tomtom-org/maps-sdk/map';
import { mapStyleLayerIDs, resolveColorStops, TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import { initColorStops } from './colorStops';
import { API_KEY, MOVE_PORTAL_KEY } from './config';
import { initHeightControls } from './height';
import { initMapControls } from './mapControls';
import { initTogglePanel } from './togglePanel';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Predefined SDK metric ranges: used for 'raw' value bounds and PCT conversion.
const PREDEFINED_RANGES: Record<AreaAnalyticsMetricKey, { min: number; max: number }> = {
    congestionLevel: { min: 0, max: 100 },
    speed: { min: 0, max: 120 },
    travelTime: { min: 0, max: 20 },
    freeFlowSpeed: { min: 0, max: 120 },
    networkLength: { min: 0, max: 5_000 },
};

const getValueRange = (
    metric: AreaAnalyticsMetricKey,
    valueType: AreaAnalyticsValueType,
): { min: number; max: number } => (valueType === 'raw' ? PREDEFINED_RANGES[metric] : { min: 0, max: 100 });

// Converts stop values between value types, using PREDEFINED_RANGES as the anchor for 'raw'.
const convertStops = (
    stops: AreaAnalyticsColorStop[],
    fromType: AreaAnalyticsValueType,
    toType: AreaAnalyticsValueType,
    metric: AreaAnalyticsMetricKey,
): AreaAnalyticsColorStop[] => {
    if (fromType === toType) return stops;

    const { min, max } = PREDEFINED_RANGES[metric];
    const span = max - min || 1;

    // Normalize each value to 0–1 relative to its source range.
    const normalized = stops.map((s) => (fromType === 'raw' ? (s.value - min) / span : s.value / 100));

    if (toType === 'raw') {
        const precision = span < 50 ? 1 : 0;
        return stops.map((s, i) => ({
            ...s,
            value: Number.parseFloat((min + normalized[i] * span).toFixed(precision)),
        }));
    }
    return stops.map((s, i) => ({ ...s, value: Math.round(normalized[i] * 100) }));
};

// Derives full-range stops from a preset theme scaled to the given metric + value type.
// resolveColorStops() returns 0–1 normalized stops; this converts them to the display range.
const themeToStops = (
    theme: AreaAnalyticsColorTheme,
    metric: AreaAnalyticsMetricKey,
    valueType: AreaAnalyticsValueType,
): AreaAnalyticsColorStop[] => {
    const normalizedStops = resolveColorStops(theme);
    if (valueType === 'raw') {
        const { min, max } = PREDEFINED_RANGES[metric];
        const span = max - min;
        const precision = span < 50 ? 1 : 0;
        return normalizedStops.map((s) => ({
            ...s,
            value: Number.parseFloat((min + s.value * span).toFixed(precision)),
        }));
    }
    return normalizedStops.map((s) => ({ ...s, value: Math.round(s.value * 100) }));
};

const pastDateRange = (): { startDate: string } => {
    const start = new Date();
    start.setDate(start.getDate() - 9);
    return { startDate: start.toISOString().slice(0, 10) };
};

const initBeforeLayerSelect = (analyticsModule: TrafficAreaAnalyticsModule): void => {
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
};

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
                metrics: 'all',
                functionalRoadClasses: 'all',
                hours: 'all',
                geometry,
            }),
        );

    const [analyticsModule, analytics] = await Promise.all([
        TrafficAreaAnalyticsModule.get(map),
        analyticsPromise,
    ]).finally(() => loadingOverlay.classList.add('aa-hidden'));

    await analyticsModule.show(analytics);

    initMapControls(map);
    initTogglePanel();

    // Bootstrap UI state from the module's fully-applied config — no need to reference defaults separately.
    const moduleConfig = analyticsModule.getConfig()!;
    const METRICS: AreaAnalyticsMetricKey[] = [
        'congestionLevel',
        'speed',
        'travelTime',
        'freeFlowSpeed',
        'networkLength',
    ];

    let currentMetric = moduleConfig.activeMetric as AreaAnalyticsMetricKey;

    // Per-metric mutable state tracked as the user edits — seeded from the module's applied config.
    let currentValueTypes = Object.fromEntries(
        METRICS.map((m) => {
            const color = moduleConfig.metricConfig?.[m]?.color;
            const valueType = typeof color === 'object' && color !== null ? (color.valueType ?? 'raw') : 'raw';
            return [m, valueType as AreaAnalyticsValueType];
        }),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsValueType>;

    let currentThemes = Object.fromEntries(
        METRICS.map((m) => {
            const color = moduleConfig.metricConfig?.[m]?.color;
            return [m, typeof color === 'string' ? color : ('custom' as AreaAnalyticsColorTheme | 'custom')];
        }),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsColorTheme | 'custom'>;

    let currentColorStops = Object.fromEntries(
        METRICS.map((m) => {
            const color = moduleConfig.metricConfig?.[m]?.color;
            return [m, color !== undefined ? resolveColorStops(color).slice() : []];
        }),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>;

    let currentHeightConfigs = Object.fromEntries(
        METRICS.map((m) => [m, { ...moduleConfig.metricConfig?.[m]?.height } as AreaAnalyticsHeightConfig]),
    ) as Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsHeightConfig>>;

    const valueTypeSelect = document.getElementById('value-type-selector') as HTMLSelectElement;
    const themeSelect = document.getElementById('color-theme-selector') as HTMLSelectElement;
    const modeSelect = document.getElementById('mode-selector') as HTMLSelectElement;
    const metricSelect = document.getElementById('metric-selector') as HTMLSelectElement;

    // Sync all selectors to their initial values from the module config.
    metricSelect.value = currentMetric;
    modeSelect.value = moduleConfig.displayMode as string;
    valueTypeSelect.value = currentValueTypes[currentMetric];
    themeSelect.value = currentThemes[currentMetric];

    const colorStopsControls = initColorStops(
        'color-stops-list',
        'add-stop-btn',
        currentColorStops[currentMetric],
        getValueRange(currentMetric, currentValueTypes[currentMetric]),
        (stops) => {
            currentColorStops[currentMetric] = stops;
            currentThemes[currentMetric] = 'custom';
            themeSelect.value = 'custom';
            analyticsModule.setColor({ valueType: currentValueTypes[currentMetric], stops }, [currentMetric]);
        },
    );

    const heightControls = initHeightControls(
        'height-max-height',
        'height-scale-factor',
        'height-min-height',
        'height-scale-mode',
        currentMetric,
        (heightConfig) => {
            currentHeightConfigs[currentMetric] = heightConfig;
            analyticsModule.setHeight(heightConfig, [currentMetric]);
        },
    );
    heightControls.update(currentMetric, currentHeightConfigs[currentMetric]);

    // Value type change: convert current stops to the new range and re-apply.
    valueTypeSelect.addEventListener('change', () => {
        const newType = valueTypeSelect.value as AreaAnalyticsValueType;
        const oldType = currentValueTypes[currentMetric];
        if (newType === oldType) return;
        const converted = convertStops(currentColorStops[currentMetric], oldType, newType, currentMetric);
        currentColorStops[currentMetric] = converted;
        currentValueTypes[currentMetric] = newType;
        currentThemes[currentMetric] = 'custom';
        themeSelect.value = 'custom';
        const range = getValueRange(currentMetric, newType);
        colorStopsControls.update(converted, range);
        analyticsModule.setColor({ valueType: newType, stops: converted }, [currentMetric]);
    });

    // Metric change: restore that metric's value type, stops, theme, and height config in all controls.
    (document.getElementById('metric-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        currentMetric = (event.target as HTMLSelectElement).value as AreaAnalyticsMetricKey;
        analyticsModule.setMetric(currentMetric);
        const vt = currentValueTypes[currentMetric];
        valueTypeSelect.value = vt;
        themeSelect.value = currentThemes[currentMetric];
        const range = getValueRange(currentMetric, vt);
        colorStopsControls.update(currentColorStops[currentMetric], range);
        heightControls.update(currentMetric, currentHeightConfigs[currentMetric]);
    });

    modeSelect.addEventListener('change', () => analyticsModule.setMode(modeSelect.value as AreaAnalyticsDisplayMode));

    // Color theme: apply preset theme and update the stops editor to match (at current value type).
    themeSelect.addEventListener('change', () => {
        const value = themeSelect.value;
        if (value === 'custom') return;
        const theme = value as AreaAnalyticsColorTheme;
        const vt = currentValueTypes[currentMetric];
        const stops = themeToStops(theme, currentMetric, vt);
        currentColorStops[currentMetric] = stops;
        currentThemes[currentMetric] = theme;
        const range = getValueRange(currentMetric, vt);
        colorStopsControls.update(stops, range);
        analyticsModule.setColor(theme, [currentMetric]);
    });

    initBeforeLayerSelect(analyticsModule);
})();
