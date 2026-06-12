import type { AreaAnalyticsMetricKey, TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsDisplayMode, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './components';

// ── Types ───────────────────────────────────────────────────────

type RadioOption<T extends string> = { value: T; label: string };

// ── Constants ───────────────────────────────────────────────────

const METRIC_OPTIONS: RadioOption<AreaAnalyticsMetricKey>[] = [
    { value: 'congestionLevel', label: 'Congestion' },
    { value: 'speed', label: 'Speed' },
    { value: 'travelTime', label: 'Travel Time' },
];

const MODE_OPTIONS: RadioOption<AreaAnalyticsDisplayMode>[] = [
    { value: 'hexgrid-3d', label: 'Hexgrid 3D' },
    { value: 'hexgrid-2d', label: 'Hexgrid 2D' },
    { value: 'square-3d', label: 'Square 3D' },
    { value: 'square-2d', label: 'Square 2D' },
    { value: 'heatmap', label: 'Heatmap' },
];

const LEGEND_LABELS: Record<AreaAnalyticsMetricKey, { min: string; max: string }> = {
    congestionLevel: { min: 'Free', max: 'Standstill' },
    speed: { min: 'Slow', max: 'Fast' },
    travelTime: { min: 'Short', max: 'Long' },
    freeFlowSpeed: { min: 'Slow', max: 'Fast' },
    networkLength: { min: 'Short', max: 'Long' },
};

// ── Sub-components ──────────────────────────────────────────────

function RadioGroup<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: RadioOption<T>[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div className="mb-3">
            <div className="mb-1 text-[11px] font-semibold uppercase text-(--sdk-text-low)">{label}</div>
            <div className="flex flex-wrap gap-1">
                {options.map((option) => (
                    <Button
                        key={option.value}
                        variant="toggle"
                        size="xs"
                        active={option.value === value}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function Stats({ analytics }: { analytics: TrafficAreaAnalytics }) {
    const base = analytics.features[0]?.properties?.baseData;
    if (!base) return null;

    const items: { label: string; value: string }[] = [];
    if (base.congestionLevel != null)
        items.push({ label: 'Congestion', value: `${Math.round(base.congestionLevel)}%` });
    if (base.speed != null) items.push({ label: 'Speed', value: `${Math.round(base.speed)} km/h` });
    if (base.travelTime != null) items.push({ label: 'Travel Time', value: `${base.travelTime.toFixed(1)} min` });
    if (base.freeFlowSpeed != null) items.push({ label: 'Free Flow', value: `${Math.round(base.freeFlowSpeed)} km/h` });

    return (
        <div className="mb-3 grid grid-cols-2 gap-2">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="rounded-(--sdk-radius-5) border border-(--sdk-border-low) bg-(--sdk-surface-1) p-2"
                >
                    <div className="text-[11px] uppercase text-(--sdk-text-low)">{item.label}</div>
                    <div className="text-[16px] font-semibold">{item.value}</div>
                </div>
            ))}
        </div>
    );
}

function Legend({ metric, module }: { metric: AreaAnalyticsMetricKey; module: TrafficAreaAnalyticsModule }) {
    const labels = LEGEND_LABELS[metric];
    const colors = getThemeColors(module, metric);

    let gradient: string;
    if (colors.length >= 2) {
        const low = colors[0];
        const mid = colors[Math.floor(colors.length / 2)];
        const high = colors.at(-1) ?? '';
        gradient = `linear-gradient(to right, ${low}, ${mid}, ${high})`;
    } else {
        gradient = 'linear-gradient(to right, hsl(0,80%,45%), hsl(60,80%,50%), hsl(120,70%,45%))';
    }

    return (
        <div className="mb-2 flex items-center gap-2 text-[11px] text-(--sdk-text-medium)">
            <span>{labels.min}</span>
            <div className="h-2 flex-1 rounded-(--sdk-radius-5)" style={{ background: gradient }} />
            <span>{labels.max}</span>
        </div>
    );
}

function HourlyChart({
    analytics,
    metric,
    module,
}: {
    analytics: TrafficAreaAnalytics;
    metric: AreaAnalyticsMetricKey;
    module: TrafficAreaAnalyticsModule;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const region = analytics.features[0]?.properties;
        const entries = region?.timedData?.average ?? region?.timedData?.hourly ?? [];
        if (entries.length === 0) {
            const context = canvas.getContext('2d');
            if (context) context.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const hourlyAverages = computeHourlyAverages(entries, metric);
        renderBarChart(canvas, hourlyAverages, metric, module);
    }, [analytics, metric, module]);

    return (
        <div className="mb-3">
            <div className="mb-1 text-[11px] font-semibold uppercase text-(--sdk-text-low)">Hourly Pattern</div>
            <canvas ref={canvasRef} className="h-20 w-full rounded-(--sdk-radius-5)" width={290} height={80} />
        </div>
    );
}

// ── Main component ──────────────────────────────────────────────

export type AnalyticsControlPanelProps = {
    analytics: TrafficAreaAnalytics;
    module: TrafficAreaAnalyticsModule;
};

export function AnalyticsControlPanel({ analytics, module }: AnalyticsControlPanelProps) {
    const [collapsed, setCollapsed] = useState(false);

    const config = module.getConfig();
    const [metric, setMetric] = useState<AreaAnalyticsMetricKey>(config?.activeMetric ?? 'congestionLevel');
    const [mode, setMode] = useState<AreaAnalyticsDisplayMode>(config?.displayMode ?? 'hexgrid-3d');

    const onMetricChange = useCallback(
        (value: AreaAnalyticsMetricKey) => {
            setMetric(value);
            module.setMetric(value);
        },
        [module],
    );

    const onModeChange = useCallback(
        (value: AreaAnalyticsDisplayMode) => {
            setMode(value);
            module.setMode(value);
        },
        [module],
    );

    return (
        <div
            className={`absolute bottom-3 left-3 z-[5] max-w-[320px] rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) text-[13px] text-(--sdk-text-high) shadow-(--sdk-shadow-e4) backdrop-blur-md ${collapsed ? 'px-4 py-3' : 'p-4'}`}
        >
            <div
                className={`flex cursor-pointer select-none items-center justify-between ${collapsed ? '' : 'mb-3'}`}
                onClick={() => setCollapsed(!collapsed)}
            >
                <span className="text-[14px] font-semibold">Traffic Analytics</span>
                <svg
                    viewBox="0 0 16 10"
                    className={`h-3.5 w-3.5 fill-none stroke-(--sdk-text-medium) [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2] transition-transform ${collapsed ? '-rotate-90' : ''}`}
                >
                    <path d="M3 1.5L8 6.5L13 1.5" />
                </svg>
            </div>
            <div className={collapsed ? 'hidden' : ''}>
                <Stats analytics={analytics} />
                <Legend metric={metric} module={module} />
                <RadioGroup label="Metric" options={METRIC_OPTIONS} value={metric} onChange={onMetricChange} />
                <RadioGroup label="Mode" options={MODE_OPTIONS} value={mode} onChange={onModeChange} />
                <HourlyChart analytics={analytics} metric={metric} module={module} />
            </div>
        </div>
    );
}

// ── Chart helpers (unchanged logic, extracted as pure functions) ─

function getThemeColors(module: TrafficAreaAnalyticsModule, metric: AreaAnalyticsMetricKey): string[] {
    const colorConfig = module.getConfig()?.metricConfig?.[metric]?.color;
    if (!colorConfig || typeof colorConfig === 'string') return [];
    return colorConfig.stops.map((stop) => stop.color);
}

function computeHourlyAverages(entries: ReadonlyArray<Record<string, unknown>>, metric: string): number[] {
    const sums = new Array(24).fill(0);
    const counts = new Array(24).fill(0);

    for (const entry of entries) {
        const hour = entry.hour as number | undefined;
        if (hour === undefined || hour < 0 || hour > 23) continue;

        const value = entry[metric] as number | undefined;
        if (value != null) {
            sums[hour] += value;
            counts[hour]++;
        }
    }

    return sums.map((sum, index) => (counts[index] > 0 ? sum / counts[index] : 0));
}

function interpolateColor(hex1: string, hex2: string, ratio: number): string {
    const parse = (hexColor: string) => {
        const cleaned = hexColor.replace('#', '');
        return [
            Number.parseInt(cleaned.slice(0, 2), 16),
            Number.parseInt(cleaned.slice(2, 4), 16),
            Number.parseInt(cleaned.slice(4, 6), 16),
        ];
    };
    const [r1, g1, b1] = parse(hex1);
    const [r2, g2, b2] = parse(hex2);
    return `rgb(${Math.round(r1 + (r2 - r1) * ratio)},${Math.round(g1 + (g2 - g1) * ratio)},${Math.round(b1 + (b2 - b1) * ratio)})`;
}

function renderBarChart(
    canvas: HTMLCanvasElement,
    hourlyValues: number[],
    metric: AreaAnalyticsMetricKey,
    module: TrafficAreaAnalyticsModule,
): void {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = 290;
    const height = 80;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(devicePixelRatio, devicePixelRatio);
    context.fillStyle = '#f7f8fa';
    context.fillRect(0, 0, width, height);

    const maximumValue = Math.max(...hourlyValues, 1);
    const barWidth = (width - 30) / 24;
    const chartHeight = height - 20;
    const colors = getThemeColors(module, metric);
    const hasStops = colors.length >= 2;
    const low = colors[0];
    const mid = colors[Math.floor(colors.length / 2)];
    const high = colors.at(-1) ?? '';

    for (let hour = 0; hour < 24; hour++) {
        const ratio = hourlyValues[hour] / maximumValue;
        const barHeight = ratio * chartHeight;

        if (hasStops) {
            context.fillStyle =
                ratio < 0.5 ? interpolateColor(low, mid, ratio * 2) : interpolateColor(mid, high, (ratio - 0.5) * 2);
        } else {
            context.fillStyle = `hsl(${120 * (1 - ratio)}, 70%, 45%)`;
        }
        context.fillRect(20 + hour * barWidth, chartHeight - barHeight, barWidth - 1, barHeight);
    }

    context.fillStyle = '#888';
    context.font = '9px -apple-system, sans-serif';
    context.textAlign = 'center';
    for (let hour = 0; hour < 24; hour += 3) {
        context.fillText(`${hour}`, 20 + hour * barWidth + barWidth / 2, height - 2);
    }

    context.fillStyle = '#666';
    context.font = '9px -apple-system, sans-serif';
    context.textAlign = 'left';
    const metricLabelMap: Partial<Record<AreaAnalyticsMetricKey, string>> = {
        congestionLevel: 'Congestion %',
        speed: 'Speed km/h',
    };
    context.fillText(metricLabelMap[metric] ?? 'Travel min', 2, 10);
}
