import { isChartConfiguration } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import {
    ArcElement,
    BarController,
    BarElement,
    BubbleController,
    CategoryScale,
    type ChartConfiguration,
    Chart as ChartJS,
    type ChartType,
    DoughnutController,
    Filler,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PieController,
    PointElement,
    PolarAreaController,
    RadarController,
    RadialLinearScale,
    ScatterController,
    Title,
    Tooltip,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useMemo, useRef } from 'react';
import { Chart } from 'react-chartjs-2';

// Register every controller + element + scale the toolkit's `CHART_TYPES` needs.
// Missing a controller produced a runtime "bar is not a registered controller"
// error — explicitly listing them keeps the registration honest as new types
// get added.
ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    ArcElement,
    PieController,
    DoughnutController,
    PolarAreaController,
    RadarController,
    ScatterController,
    BubbleController,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin,
);

// Chart types that use cartesian scales — the zoom plugin only makes sense on these.
// pie/doughnut/radar/polarArea have no x/y zoom semantics.
const ZOOMABLE_CHART_TYPES = new Set<ChartType>(['bar', 'line', 'scatter', 'bubble']);

// Categorical chart types where a single dataset spans many labels, so each
// slice/segment needs its own color rather than the whole dataset sharing one.
const CATEGORICAL_CHART_TYPES = new Set<ChartType>(['pie', 'doughnut', 'polarArea']);

// Curated 10-color palette (Tailwind 500s) — balanced hues, readable on light & dark backgrounds.
const PALETTE = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
] as const;

// Convert a hex color to rgba with the given alpha — used for translucent fills (bar background, line area fill).
const withAlpha = (hex: string, alpha: number): string => {
    const n = Number.parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type Dataset = Record<string, unknown>;

const pickColor = (index: number) => PALETTE[index % PALETTE.length];

// Layer a default palette onto dataset colors without overwriting anything the
// LLM's code explicitly set. Categorical types (pie/doughnut/polarArea) get an
// array of colors sized to the label count; other types get one color per dataset.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: chart palette logic requires multiple type-specific branches
const withPaletteDefaults = (config: ChartConfiguration): ChartConfiguration => {
    const data = config.data as unknown as { labels?: unknown[]; datasets?: Dataset[] } | undefined;
    const datasets = data?.datasets;
    if (!Array.isArray(datasets) || datasets.length === 0) return config;

    const isCategorical = CATEGORICAL_CHART_TYPES.has(config.type);
    const labelCount = Array.isArray(data?.labels) ? data.labels.length : 0;

    for (let i = 0; i < datasets.length; i += 1) {
        const ds = datasets[i];
        const color = pickColor(i);

        if (isCategorical) {
            // One dataset, many segments — color each segment.
            if (ds.backgroundColor === undefined) {
                const count = Math.max(labelCount, (ds.data as unknown[] | undefined)?.length ?? 0);
                ds.backgroundColor = Array.from({ length: count }, (_, j) => pickColor(j));
            }
            if (ds.borderColor === undefined) ds.borderColor = '#ffffff';
            if (ds.borderWidth === undefined) ds.borderWidth = 2;
            continue;
        }

        // Cartesian / radar: one color per dataset. Fills use a translucent variant
        // so overlapping datasets stay readable.
        if (ds.borderColor === undefined) ds.borderColor = color;
        if (ds.backgroundColor === undefined) {
            ds.backgroundColor = config.type === 'line' || config.type === 'radar' ? withAlpha(color, 0.2) : color;
        }
        if (config.type === 'line') {
            if (ds.pointBackgroundColor === undefined) ds.pointBackgroundColor = color;
            if (ds.tension === undefined) ds.tension = 0.25;
        }
    }

    return config;
};

const isRegistered = (lookup: () => unknown): boolean => {
    try {
        lookup();
        return true;
    } catch {
        return false;
    }
};

type ScaleAxisOptions = { type?: string; axis?: unknown; position?: unknown };

const isAxisId = (id: string): boolean => id === 'x' || id === 'y' || id === 'r';
const AXIS_POSITIONS = new Set(['top', 'bottom', 'left', 'right']);
const namesAxis = (options: ScaleAxisOptions): boolean =>
    !!options.axis || (typeof options.position === 'string' && AXIS_POSITIONS.has(options.position));
const hasScaleDefaults = (type: string): type is keyof typeof ChartJS.defaults.scales =>
    type in ChartJS.defaults.scales;

// Whether Chart.js can build a scale: its type is registered, and its axis can be told the way the config
// merge tells it, from an id that is or starts with `x`, `y` or `r`, the scale's `axis` or side
// `position`, a dataset bound to it, or its type's defaults.
const isRenderableScale = (id: string, scale: ScaleAxisOptions, config: ChartConfiguration): boolean => {
    const { type } = scale;
    if (type !== undefined && !isRegistered(() => ChartJS.registry.getScale(type))) return false;
    return (
        isAxisId(id) ||
        (id.length > 1 && isAxisId(id[0].toLowerCase())) ||
        namesAxis(scale) ||
        config.data.datasets.some(
            (dataset) =>
                ('xAxisID' in dataset && dataset.xAxisID === id) || ('yAxisID' in dataset && dataset.yAxisID === id),
        ) ||
        (type !== undefined && hasScaleDefaults(type) && namesAxis(ChartJS.defaults.scales[type]))
    );
};

/**
 * Whether Chart.js can build the config: its datasets are an array of objects, every dataset type and
 * scale it names is registered above, and each scale's axis can be told. Chart.js throws on anything
 * else, such as a model's `logarithmic` axis, `area` dataset or scale id `delay` with no `axis`, and
 * nothing above the chart catches that render error.
 */
export const isRenderableChart = (config: ChartConfiguration): boolean => {
    const datasets: unknown = config.data.datasets;
    if (!Array.isArray(datasets) || !datasets.every((dataset) => dataset !== null && typeof dataset === 'object')) {
        return false;
    }
    const datasetTypes = config.data.datasets.map((dataset) => dataset.type);
    return (
        datasetTypes.every((type) => type === undefined || isRegistered(() => ChartJS.registry.getController(type))) &&
        Object.entries(config.options?.scales ?? {}).every(
            ([id, scale]) => !scale || typeof scale !== 'object' || isRenderableScale(id, scale, config),
        )
    );
};

// Shallow-merge sensible interactivity defaults into the LLM-provided options
// without clobbering anything the code explicitly set.
const withInteractivityDefaults = (config: ChartConfiguration): ChartConfiguration => {
    const isZoomable = ZOOMABLE_CHART_TYPES.has(config.type);
    const userOptions = (config.options ?? {}) as Record<string, unknown>;
    const userPlugins = (userOptions.plugins ?? {}) as Record<string, unknown>;
    const userInteraction = (userOptions.interaction ?? {}) as Record<string, unknown>;

    return {
        ...config,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...userOptions,
            interaction: {
                mode: 'nearest',
                intersect: false,
                ...userInteraction,
            },
            plugins: {
                tooltip: { enabled: true },
                legend: { display: true },
                ...userPlugins,
                ...(isZoomable && {
                    zoom: {
                        pan: { enabled: true, mode: 'xy', modifierKey: null },
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            drag: { enabled: false },
                            mode: 'xy',
                        },
                        limits: { x: { minRange: 1 }, y: { minRange: 1 } },
                        ...((userPlugins.zoom as Record<string, unknown> | undefined) ?? {}),
                    },
                }),
            },
        },
    } as ChartConfiguration;
};

type AnalysisChartProps = {
    config: unknown;
};

export function AnalysisChart({ config }: AnalysisChartProps) {
    const chartRef = useRef<ChartJS>(null);

    // Deep-clone so react-chartjs-2 can mutate without corrupting the value we read
    // from the assistant-ui state store, and layer defaults on top.
    const prepared = useMemo(
        () =>
            isChartConfiguration(config) && isRenderableChart(config)
                ? withInteractivityDefaults(withPaletteDefaults(structuredClone(config)))
                : null,
        [config],
    );

    if (!prepared) {
        return <div className="p-2 font-mono text-[12px] text-(--ui-text-med-em)">Invalid chart configuration.</div>;
    }

    const isZoomable = ZOOMABLE_CHART_TYPES.has(prepared.type);

    const handleResetZoom = () => {
        chartRef.current?.resetZoom();
    };

    return (
        <div className="flex w-full flex-col gap-2">
            {isZoomable && (
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-(--ui-text-low-em)">
                        scroll / pinch to zoom · drag to pan
                    </span>
                    <button
                        type="button"
                        onClick={handleResetZoom}
                        className="cursor-pointer rounded-(--ui-rounded-5) border border-(--ui-border-med-em) bg-(--ui-surface-1) px-1.5 py-0.5 font-mono text-[11px] leading-snug text-(--ui-text-med-em) transition-colors hover:bg-(--ui-surface-2) hover:text-(--ui-text-high-em)"
                    >
                        Reset zoom
                    </button>
                </div>
            )}
            <div className="relative max-h-[320px] min-h-[220px] w-full cursor-grab active:cursor-grabbing">
                <Chart ref={chartRef} type={prepared.type} data={prepared.data} options={prepared.options} />
            </div>
        </div>
    );
}
