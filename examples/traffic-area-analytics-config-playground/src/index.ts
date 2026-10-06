import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import { areaAnalyticsMetricKeys, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type {
    AreaAnalyticsColorStop,
    AreaAnalyticsDisplayMode,
    AreaAnalyticsHeightConfig,
    AreaAnalyticsPalette,
    AreaAnalyticsScaleMode,
    BeforeLayerConfig,
    KnobRange,
    TrafficAreaAnalyticsKnobId,
} from '@tomtom-org/maps-sdk/map';
import {
    knobEntryOf,
    mapStyleLayerIDs,
    resolveColorStops,
    setKnob,
    TomTomMap,
    TrafficAreaAnalyticsModule,
    trafficAreaAnalyticsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import { initColorStops } from './colorStops';
import { API_KEY, MOVE_PORTAL_KEY } from './config';
import { initHeightControls } from './height';
import { initMapControls } from './mapControls';
import { initTogglePanel } from './togglePanel';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const knobOf = (id: TrafficAreaAnalyticsKnobId) => knobEntryOf(trafficAreaAnalyticsKnobCatalogue, id);

type SelectOption =
    | AreaAnalyticsMetricKey
    | AreaAnalyticsDisplayMode
    | AreaAnalyticsPalette
    | NonNullable<AreaAnalyticsHeightConfig['scaleMode']>;

const OPTION_LABELS: Record<string, string> = {
    congestionLevel: 'Congestion Level',
    speed: 'Speed',
    travelTime: 'Travel Time',
    freeFlowSpeed: 'Free Flow Speed',
    networkLength: 'Network Length (road density)',
    'hexgrid-3d': '3D Hex Grid',
    'hexgrid-2d': 'Flat Hex Grid',
    'square-3d': '3D Square Grid',
    'square-2d': 'Flat Square Grid',
    heatmap: 'Heatmap',
    trafficLight: 'Traffic Light',
    heat: 'Heat',
    monochrome: 'Monochrome',
    viridis: 'Viridis',
    plasma: 'Plasma',
    raw: 'Raw',
    predefinedRange: 'Predefined range',
    currentRange: 'Current range',
} satisfies Record<SelectOption, string>;

// The catalogue's options for the knob, ahead of any option the markup already holds.
const fillSelect = (selectId: string, knobId: TrafficAreaAnalyticsKnobId): void => {
    const knob = knobOf(knobId);
    if (knob.kind !== 'enum') throw new Error(`No options for ${knobId}`);

    const select = document.getElementById(selectId) as HTMLSelectElement;
    const firstOwnOption = select.options[0] ?? null;
    for (const option of knob.options) {
        select.add(new Option(OPTION_LABELS[option], option), firstOwnOption);
    }
};

fillSelect('metric-selector', 'activeMetric');
fillSelect('mode-selector', 'displayMode');
fillSelect('palette-selector', 'metrics.congestionLevel.palette');
fillSelect('height-scale-mode', 'metrics.congestionLevel.height.scaleMode');

// Bounds, step and placeholder from the catalogue: its range and its default. A height's range is
// `hard-min`, so the input takes no negative height but any above the range's max.
const applyNumberKnob = (inputId: string, knobId: TrafficAreaAnalyticsKnobId): void => {
    const knob = knobOf(knobId);
    if (knob.kind !== 'number') throw new Error(`No range for ${knobId}`);

    const { min, max, step, bounds } = knob.range;
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (bounds !== 'soft') input.min = String(min);
    if (bounds === 'hard') input.max = String(max);
    input.step = String(step ?? 'any');
    input.placeholder = String(knob.default ?? '');
};

applyNumberKnob('height-max-height', 'metrics.congestionLevel.height.maxMeters');
applyNumberKnob('height-meters-per-unit', 'metrics.congestionLevel.height.metersPerUnit');
applyNumberKnob('height-min-height', 'metrics.congestionLevel.height.minMeters');

// A metric's predefined range, used for 'raw' value bounds and PCT conversion: the catalogue ranges
// its filter over it.
const predefinedRange = (metric: AreaAnalyticsMetricKey): KnobRange => {
    const knob = knobOf(`metrics.${metric}.filters.min`);
    if (knob.kind !== 'number') throw new Error(`No range for ${metric}`);

    return knob.range;
};

const getValueRange = (
    metric: AreaAnalyticsMetricKey,
    scaleMode: AreaAnalyticsScaleMode,
): Pick<KnobRange, 'min' | 'max'> => (scaleMode === 'raw' ? predefinedRange(metric) : { min: 0, max: 100 });

// Converts stop values between scale modes, using the predefined range as the anchor for 'raw'.
const convertStops = (
    stops: AreaAnalyticsColorStop[],
    fromType: AreaAnalyticsScaleMode,
    toType: AreaAnalyticsScaleMode,
    metric: AreaAnalyticsMetricKey,
): AreaAnalyticsColorStop[] => {
    if (fromType === toType) return stops;

    const { min, max } = predefinedRange(metric);
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

const pastDateRange = (): { startDate: string; endDate: string } => {
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date();
    start.setDate(start.getDate() - 9);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
};

const initBeforeLayerSelect = (analyticsModule: TrafficAreaAnalyticsModule): void => {
    const select = document.getElementById('before-layer-selector') as HTMLSelectElement;
    select.add(new Option('Above all layers', 'top'));
    for (const key of Object.keys(mapStyleLayerIDs) as (keyof typeof mapStyleLayerIDs)[]) {
        select.add(new Option(key, key));
        if (key === 'lowestLabel') select.options[select.options.length - 1].selected = true;
    }
    select.addEventListener('change', () => {
        analyticsModule.updateConfig({ beforeLayerConfig: select.value as BeforeLayerConfig });
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
        TrafficAreaAnalyticsModule.create(map),
        analyticsPromise,
    ]).finally(() => loadingOverlay.classList.add('aa-hidden'));

    await analyticsModule.show(analytics);

    initMapControls(map);
    initTogglePanel();

    // Bootstrap UI state from the module's fully-applied config — no need to reference defaults separately.
    const moduleConfig = analyticsModule.getConfig()!;
    let currentMetric = moduleConfig.activeMetric as AreaAnalyticsMetricKey;

    // Per-metric mutable state tracked as the user edits — seeded from the module's applied config.
    // The stops editor starts on the stops a metric's palette resolves to; editing them sets `colorStops`.
    const drawnStops = Object.fromEntries(
        areaAnalyticsMetricKeys.map((metric) => [metric, resolveColorStops(metric, moduleConfig.metrics?.[metric])]),
    );

    let currentScaleModes = Object.fromEntries(
        areaAnalyticsMetricKeys.map((metric) => [metric, drawnStops[metric].scaleMode ?? 'raw']),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsScaleMode>;

    let currentPalettes = Object.fromEntries(
        areaAnalyticsMetricKeys.map((metric) => {
            const metrics = moduleConfig.metrics?.[metric];
            return [metric, metrics?.colorStops ? 'custom' : (metrics?.palette ?? 'trafficLight')];
        }),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsPalette | 'custom'>;

    let currentColorStops = Object.fromEntries(
        areaAnalyticsMetricKeys.map((metric) => [metric, drawnStops[metric].stops.slice()]),
    ) as Record<AreaAnalyticsMetricKey, AreaAnalyticsColorStop[]>;

    let currentHeightConfigs = Object.fromEntries(
        areaAnalyticsMetricKeys.map((metric) => [
            metric,
            { ...moduleConfig.metrics?.[metric]?.height } as AreaAnalyticsHeightConfig,
        ]),
    ) as Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsHeightConfig>>;

    const scaleModeSelect = document.getElementById('scale-mode-selector') as HTMLSelectElement;
    const paletteSelect = document.getElementById('palette-selector') as HTMLSelectElement;
    const modeSelect = document.getElementById('mode-selector') as HTMLSelectElement;
    const metricSelect = document.getElementById('metric-selector') as HTMLSelectElement;

    // Sync all selectors to their initial values from the module config.
    metricSelect.value = currentMetric;
    modeSelect.value = moduleConfig.displayMode as string;
    scaleModeSelect.value = currentScaleModes[currentMetric];
    paletteSelect.value = currentPalettes[currentMetric];

    const colorStopsControls = initColorStops(
        'color-stops-list',
        'add-stop-btn',
        currentColorStops[currentMetric],
        getValueRange(currentMetric, currentScaleModes[currentMetric]),
        (stops) => {
            currentColorStops[currentMetric] = stops;
            currentPalettes[currentMetric] = 'custom';
            paletteSelect.value = 'custom';
            analyticsModule.setColorStops({ scaleMode: currentScaleModes[currentMetric], stops }, [currentMetric]);
        },
    );

    const heightControls = initHeightControls(
        'height-max-height',
        'height-meters-per-unit',
        'height-min-height',
        'height-scale-mode',
        (knob, value) => {
            setKnob(
                analyticsModule,
                trafficAreaAnalyticsKnobCatalogue,
                `metrics.${currentMetric}.height.${knob}`,
                value,
            );
            currentHeightConfigs[currentMetric] = analyticsModule.getConfig()?.metrics?.[currentMetric]?.height;
        },
    );
    heightControls.update(currentMetric, currentHeightConfigs[currentMetric]);

    // Scale mode change: convert current stops to the new range and re-apply.
    scaleModeSelect.addEventListener('change', () => {
        const newType = scaleModeSelect.value as AreaAnalyticsScaleMode;
        const oldType = currentScaleModes[currentMetric];
        if (newType === oldType) return;
        const converted = convertStops(currentColorStops[currentMetric], oldType, newType, currentMetric);
        currentColorStops[currentMetric] = converted;
        currentScaleModes[currentMetric] = newType;
        currentPalettes[currentMetric] = 'custom';
        paletteSelect.value = 'custom';
        const range = getValueRange(currentMetric, newType);
        colorStopsControls.update(converted, range);
        analyticsModule.setColorStops({ scaleMode: newType, stops: converted }, [currentMetric]);
    });

    // Metric change: restore that metric's scale mode, stops, palette, and height config in all controls.
    (document.getElementById('metric-selector') as HTMLSelectElement).addEventListener('change', (event) => {
        currentMetric = (event.target as HTMLSelectElement).value as AreaAnalyticsMetricKey;
        analyticsModule.updateConfig({ activeMetric: currentMetric });
        const vt = currentScaleModes[currentMetric];
        scaleModeSelect.value = vt;
        paletteSelect.value = currentPalettes[currentMetric];
        const range = getValueRange(currentMetric, vt);
        colorStopsControls.update(currentColorStops[currentMetric], range);
        heightControls.update(currentMetric, currentHeightConfigs[currentMetric]);
    });

    modeSelect.addEventListener('change', () =>
        analyticsModule.updateConfig({ displayMode: modeSelect.value as AreaAnalyticsDisplayMode }),
    );

    // Palette: drop the metric's own stops so its palette shows, and load the stops it resolves to
    // into the editor.
    paletteSelect.addEventListener('change', () => {
        const value = paletteSelect.value;
        if (value === 'custom') return;
        const palette = value as AreaAnalyticsPalette;
        analyticsModule.setColorStops(undefined, [currentMetric]);
        analyticsModule.setPalette(palette, [currentMetric]);
        const { scaleMode = 'raw', stops } = resolveColorStops(currentMetric, { palette });
        currentColorStops[currentMetric] = stops.slice();
        currentScaleModes[currentMetric] = scaleMode;
        currentPalettes[currentMetric] = palette;
        scaleModeSelect.value = scaleMode;
        colorStopsControls.update(currentColorStops[currentMetric], getValueRange(currentMetric, scaleMode));
    });

    initBeforeLayerSelect(analyticsModule);
})();
