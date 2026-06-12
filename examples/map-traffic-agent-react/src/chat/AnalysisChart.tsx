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

// Register every controller + element + scale we expose via `CHART_TYPES`.
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

const CHART_TYPES = new Set<ChartType>(['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble']);

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

const isChartConfiguration = (value: unknown): value is ChartConfiguration => {
    if (!value || typeof value !== 'object') return false;
    const v = value as { type?: unknown; data?: unknown };
    return (
        typeof v.type === 'string' &&
        CHART_TYPES.has(v.type as ChartType) &&
        typeof v.data === 'object' &&
        v.data !== null
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
            isChartConfiguration(config)
                ? withInteractivityDefaults(withPaletteDefaults(structuredClone(config)))
                : null,
        [config],
    );

    if (!prepared) {
        return <div className="p-2 font-mono text-[12px] text-(--sdk-text-medium)">Invalid chart configuration.</div>;
    }

    const isZoomable = ZOOMABLE_CHART_TYPES.has(prepared.type);

    const handleResetZoom = () => {
        chartRef.current?.resetZoom();
    };

    return (
        <div className="flex w-full flex-col gap-2">
            {isZoomable && (
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-(--sdk-text-low)">
                        scroll / pinch to zoom · drag to pan
                    </span>
                    <button
                        type="button"
                        onClick={handleResetZoom}
                        className="cursor-pointer rounded-(--sdk-radius-5) border border-(--sdk-border-medium) bg-(--sdk-surface-1) px-1.5 py-0.5 font-mono text-[11px] leading-snug text-(--sdk-text-medium) transition-colors hover:bg-(--sdk-surface-2) hover:text-(--sdk-text-high)"
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
