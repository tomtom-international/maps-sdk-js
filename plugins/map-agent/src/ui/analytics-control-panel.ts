/**
 * @module map-agent-ui
 *
 * Opt-in overlay panel for traffic area analytics visualization controls.
 * Provides metric/mode/color toggles and an hourly heatmap chart.
 * All interactions update the module directly, which emits configChange events
 * to keep agent state in sync.
 */

import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type {
    AreaAnalyticsColorScheme,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMode,
    TrafficAreaAnalyticsModule,
} from '@tomtom-org/maps-sdk/map';
import { COLOR_SCHEMES } from '@tomtom-org/maps-sdk/map';

// ── Types ───────────────────────────────────────────────────────────

type RadioOption<T extends string> = { value: T; label: string };

// ── Constants ───────────────────────────────────────────────────────

const METRIC_OPTIONS: RadioOption<AreaAnalyticsMetricKey>[] = [
    { value: 'congestionLevel', label: 'Congestion' },
    { value: 'speed', label: 'Speed' },
    { value: 'travelTime', label: 'Travel Time' },
];

const MODE_OPTIONS: RadioOption<AreaAnalyticsMode>[] = [
    { value: 'hexgrid', label: 'Hexgrid' },
    { value: 'heatmap', label: 'Heatmap' },
    { value: 'tiles', label: 'Tiles' },
];

const LEGEND_LABELS: Record<AreaAnalyticsMetricKey, { min: string; max: string }> = {
    congestionLevel: { min: 'Free', max: 'Standstill' },
    speed: { min: 'Slow', max: 'Fast' },
    travelTime: { min: 'Short', max: 'Long' },
};

// ── Styles (injected once) ──────────────────────────────────────────

const STYLE_ID = 'aa-control-panel-styles';

function injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .aa-panel {
            position: absolute;
            bottom: 12px;
            left: 12px;
            z-index: 10;
            background: rgba(255,255,255,0.95);
            border-radius: 10px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            padding: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #333;
            max-width: 320px;
            backdrop-filter: blur(8px);
        }
        .aa-panel.collapsed .aa-panel-body {
            display: none;
        }
        .aa-panel.collapsed {
            padding: 10px 14px;
        }
        .aa-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
            margin-bottom: 10px;
        }
        .aa-panel-title {
            font-weight: 600;
            font-size: 14px;
        }
        .aa-panel-chevron {
            width: 14px;
            height: 14px;
            transition: transform 0.2s;
            stroke: #666;
            stroke-width: 2;
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .aa-panel.collapsed .aa-panel-chevron {
            transform: rotate(-90deg);
        }
        .aa-panel-section {
            margin-bottom: 10px;
        }
        .aa-panel-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 4px;
        }
        .aa-radio-group {
            display: flex;
            gap: 4px;
        }
        .aa-radio-btn {
            cursor: pointer;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 12px;
            transition: all 0.15s;
        }
        .aa-radio-btn:hover { border-color: #aaa; }
        .aa-radio-btn.active {
            background: #1a73e8;
            color: #fff;
            border-color: #1a73e8;
        }
        .aa-panel-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 10px;
        }
        .aa-stat {
            background: #f8f8f8;
            border-radius: 6px;
            padding: 6px 8px;
        }
        .aa-stat-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
        }
        .aa-stat-value {
            font-size: 16px;
            font-weight: 600;
        }
        .aa-panel-legend {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
        }
        .aa-legend-bar {
            flex: 1;
            height: 8px;
            border-radius: 4px;
        }
        .aa-panel-chart {
            width: 100%;
            height: 80px;
            border-radius: 6px;
        }
    `;
    document.head.appendChild(style);
}

// ── Panel class ─────────────────────────────────────────────────────

/**
 * Opt-in control panel overlay for traffic area analytics.
 *
 * Creates DOM elements on the map container with metric/mode/color toggles,
 * stats summary, color legend, and an hourly chart.
 * All interactions call module setters → trigger configChange → sync agent state.
 */
export class AnalyticsControlPanel {
    private container: HTMLElement | null = null;
    private chartCanvas: HTMLCanvasElement | null = null;
    private analytics: TrafficAreaAnalytics | null = null;

    private currentMetric: AreaAnalyticsMetricKey = 'congestionLevel';
    private currentMode: AreaAnalyticsMode = 'hexgrid';
    private currentScheme: AreaAnalyticsColorScheme = 'congestion';

    constructor(
        private readonly mapContainer: HTMLElement,
        private readonly module: TrafficAreaAnalyticsModule,
    ) {}

    /**
     * Show the panel with analytics data. Creates DOM if needed, updates stats + chart.
     */
    show(analytics: TrafficAreaAnalytics): void {
        this.analytics = analytics;
        injectStyles();

        // Read current config from module
        const config = this.module.getConfig();
        this.currentMetric = config?.metric ?? 'congestionLevel';
        this.currentMode = config?.mode ?? 'hexgrid';
        this.currentScheme = config?.colorScheme ?? 'congestion';

        if (!this.container) {
            this.container = this.buildDOM();
            this.mapContainer.appendChild(this.container);
        }

        this.updateStats(analytics);
        this.updateLegend();
        this.updateChart(analytics);
        this.syncRadioStates();
    }

    /**
     * Hide the panel (remove from DOM but keep instance alive).
     */
    hide(): void {
        this.container?.remove();
        this.container = null;
        this.chartCanvas = null;
    }

    /**
     * Update with new analytics data (e.g., after re-fetch).
     */
    update(analytics: TrafficAreaAnalytics): void {
        this.analytics = analytics;
        this.updateStats(analytics);
        this.updateChart(analytics);
    }

    /**
     * Destroy the panel completely.
     */
    destroy(): void {
        this.hide();
        this.analytics = null;
    }

    // ── DOM construction ────────────────────────────────────────────

    private buildDOM(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'aa-panel';

        // Header with chevron toggle
        const header = document.createElement('div');
        header.className = 'aa-panel-header';
        header.innerHTML = `
            <span class="aa-panel-title">Traffic Analytics</span>
            <svg class="aa-panel-chevron" viewBox="0 0 16 10">
                <path d="M3 1.5L8 6.5L13 1.5" />
            </svg>
        `;
        header.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });
        panel.appendChild(header);

        // Body — everything below the header, hidden when collapsed
        const body = document.createElement('div');
        body.className = 'aa-panel-body';

        // Stats
        const stats = document.createElement('div');
        stats.className = 'aa-panel-stats';
        stats.id = 'aa-panel-stats';
        body.appendChild(stats);

        // Legend
        const legend = document.createElement('div');
        legend.className = 'aa-panel-legend';
        legend.id = 'aa-panel-legend';
        body.appendChild(legend);

        // Metric selector
        body.appendChild(
            this.buildRadioSection('Metric', METRIC_OPTIONS, this.currentMetric, (value) => {
                this.currentMetric = value as AreaAnalyticsMetricKey;
                this.module.setMetric(this.currentMetric);
                this.updateLegend();
                if (this.analytics) this.updateChart(this.analytics);
            }),
        );

        // Mode selector
        body.appendChild(
            this.buildRadioSection('Mode', MODE_OPTIONS, this.currentMode, (value) => {
                this.currentMode = value as AreaAnalyticsMode;
                this.module.setMode(this.currentMode);
            }),
        );

        // Hourly chart
        const chartSection = document.createElement('div');
        chartSection.className = 'aa-panel-section';
        const chartLabel = document.createElement('div');
        chartLabel.className = 'aa-panel-label';
        chartLabel.textContent = 'Hourly Pattern';
        chartSection.appendChild(chartLabel);

        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.className = 'aa-panel-chart';
        this.chartCanvas.width = 290;
        this.chartCanvas.height = 80;
        chartSection.appendChild(this.chartCanvas);
        body.appendChild(chartSection);

        panel.appendChild(body);
        return panel;
    }

    private buildRadioSection<T extends string>(
        label: string,
        options: RadioOption<T>[],
        activeValue: T,
        onChange: (value: T) => void,
    ): HTMLElement {
        const section = document.createElement('div');
        section.className = 'aa-panel-section';

        const labelEl = document.createElement('div');
        labelEl.className = 'aa-panel-label';
        labelEl.textContent = label;
        section.appendChild(labelEl);

        const group = document.createElement('div');
        group.className = 'aa-radio-group';

        for (const opt of options) {
            const btn = document.createElement('button');
            btn.className = `aa-radio-btn${opt.value === activeValue ? ' active' : ''}`;
            btn.textContent = opt.label;
            btn.dataset.value = opt.value;
            btn.addEventListener('click', () => {
                group.querySelectorAll('.aa-radio-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                onChange(opt.value);
            });
            group.appendChild(btn);
        }

        section.appendChild(group);
        return section;
    }

    // ── Update helpers ──────────────────────────────────────────────

    private updateStats(analytics: TrafficAreaAnalytics): void {
        const stats = this.container?.querySelector('#aa-panel-stats');
        if (!stats) return;

        const base = analytics.features[0]?.properties?.baseData;
        if (!base) {
            stats.innerHTML = '';
            return;
        }

        const items: { label: string; value: string }[] = [];
        if (base.congestionLevel != null)
            items.push({ label: 'Congestion', value: `${Math.round(base.congestionLevel)}%` });
        if (base.speed != null) items.push({ label: 'Speed', value: `${Math.round(base.speed)} km/h` });
        if (base.travelTime != null) items.push({ label: 'Travel Time', value: `${base.travelTime.toFixed(1)} min` });
        if (base.freeFlowSpeed != null)
            items.push({ label: 'Free Flow', value: `${Math.round(base.freeFlowSpeed)} km/h` });

        stats.innerHTML = items
            .map(
                (i) =>
                    `<div class="aa-stat"><div class="aa-stat-label">${i.label}</div><div class="aa-stat-value">${i.value}</div></div>`,
            )
            .join('');
    }

    private updateLegend(): void {
        const legend = this.container?.querySelector('#aa-panel-legend');
        if (!legend) return;

        const { low, mid, high } = COLOR_SCHEMES[this.currentScheme];
        const labels = LEGEND_LABELS[this.currentMetric];
        const isInverted = this.currentMetric === 'speed';
        const gradient = isInverted
            ? `linear-gradient(to right, ${high}, ${mid}, ${low})`
            : `linear-gradient(to right, ${low}, ${mid}, ${high})`;

        legend.innerHTML = `
            <span>${labels.min}</span>
            <div class="aa-legend-bar" style="background: ${gradient}"></div>
            <span>${labels.max}</span>
        `;
    }

    private updateChart(analytics: TrafficAreaAnalytics): void {
        if (!this.chartCanvas) return;

        const region = analytics.features[0]?.properties;
        const entries = region?.timedData?.average ?? region?.timedData?.hourly ?? [];
        if (entries.length === 0) {
            const context = this.chartCanvas.getContext('2d');
            if (context) context.clearRect(0, 0, this.chartCanvas.width, this.chartCanvas.height);
            return;
        }

        const hourlyAverages = this.computeHourlyAverages(entries);
        this.renderBarChart(hourlyAverages);
    }

    /** Average timed entries by hour (0-23) for the current metric. */
    private computeHourlyAverages(entries: ReadonlyArray<Record<string, unknown>>): number[] {
        const sums = new Array(24).fill(0);
        const counts = new Array(24).fill(0);

        for (const entry of entries) {
            const hour = entry.hour as number | undefined;
            if (hour === undefined || hour < 0 || hour > 23) continue;

            const value = entry[this.currentMetric] as number | undefined;
            if (value != null) {
                sums[hour] += value;
                counts[hour]++;
            }
        }

        return sums.map((sum, index) => (counts[index] > 0 ? sum / counts[index] : 0));
    }

    /** Render a bar chart of 24 hourly values on the canvas. */
    private renderBarChart(hourlyValues: number[]): void {
        const canvas = this.chartCanvas!;
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
        const { low, mid, high } = COLOR_SCHEMES[this.currentScheme];

        for (let hour = 0; hour < 24; hour++) {
            const ratio = hourlyValues[hour] / maximumValue;
            const barHeight = ratio * chartHeight;

            context.fillStyle =
                ratio < 0.5
                    ? this.interpolateColor(low, mid, ratio * 2)
                    : this.interpolateColor(mid, high, (ratio - 0.5) * 2);
            context.fillRect(20 + hour * barWidth, chartHeight - barHeight, barWidth - 1, barHeight);
        }

        // Hour labels (every 3 hours)
        context.fillStyle = '#888';
        context.font = '9px -apple-system, sans-serif';
        context.textAlign = 'center';
        for (let hour = 0; hour < 24; hour += 3) {
            context.fillText(`${hour}`, 20 + hour * barWidth + barWidth / 2, height - 2);
        }

        // Metric label
        context.fillStyle = '#666';
        context.font = '9px -apple-system, sans-serif';
        context.textAlign = 'left';
        const metricLabel =
            this.currentMetric === 'congestionLevel'
                ? 'Congestion %'
                : this.currentMetric === 'speed'
                  ? 'Speed km/h'
                  : 'Travel min';
        context.fillText(metricLabel, 2, 10);
    }

    /** Linearly interpolate between two hex colors at ratio t (0-1). */
    private interpolateColor(hex1: string, hex2: string, ratio: number): string {
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

    private syncRadioStates(): void {
        if (!this.container) return;

        // Sync radio buttons to current state (metric, mode — 2 groups)
        const groups = this.container.querySelectorAll('.aa-radio-group');
        const values = [this.currentMetric, this.currentMode];
        groups.forEach((group, i) => {
            group.querySelectorAll('.aa-radio-btn').forEach((btn) => {
                const el = btn as HTMLElement;
                el.classList.toggle('active', el.dataset.value === values[i]);
            });
        });
    }
}
