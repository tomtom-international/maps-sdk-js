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

const ZOOMABLE_CHART_TYPES = new Set<ChartType>(['bar', 'line', 'scatter', 'bubble']);

const CATEGORICAL_CHART_TYPES = new Set<ChartType>(['pie', 'doughnut', 'polarArea']);

const PALETTE = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
] as const;

const withAlpha = (hex: string, alpha: number): string => {
    const n = Number.parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type Dataset = Record<string, unknown>;

const pickColor = (index: number) => PALETTE[index % PALETTE.length];

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
            if (ds.backgroundColor === undefined) {
                const count = Math.max(labelCount, (ds.data as unknown[] | undefined)?.length ?? 0);
                ds.backgroundColor = Array.from({ length: count }, (_, j) => pickColor(j));
            }
            if (ds.borderColor === undefined) ds.borderColor = '#ffffff';
            if (ds.borderWidth === undefined) ds.borderWidth = 2;
            continue;
        }

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

    const prepared = useMemo(
        () =>
            isChartConfiguration(config)
                ? withInteractivityDefaults(withPaletteDefaults(structuredClone(config)))
                : null,
        [config],
    );

    if (!prepared) {
        return <div className="analysis-chart-error">Invalid chart configuration.</div>;
    }

    const isZoomable = ZOOMABLE_CHART_TYPES.has(prepared.type);

    const handleResetZoom = () => {
        chartRef.current?.resetZoom();
    };

    return (
        <div className="analysis-chart">
            {isZoomable && (
                <div className="analysis-chart-toolbar">
                    <span className="analysis-chart-hint">scroll / pinch to zoom · drag to pan</span>
                    <button type="button" onClick={handleResetZoom} className="analysis-chart-reset">
                        Reset zoom
                    </button>
                </div>
            )}
            <div className="analysis-chart-canvas">
                <Chart ref={chartRef} type={prepared.type} data={prepared.data} options={prepared.options} />
            </div>
        </div>
    );
}
