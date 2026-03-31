import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorTheme, AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/map';
import { COLOR_SCHEMES } from '@tomtom-org/maps-sdk/map';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const LEGEND_LABELS: Record<AreaAnalyticsMetricKey, { title: string; min: string; max: string }> = {
    congestionLevel: { title: 'Congestion Level', min: 'Free', max: 'Standstill' },
    speed: { title: 'Speed', min: 'Slow', max: 'Fast' },
    travelTime: { title: 'Travel Time', min: 'Short', max: 'Long' },
};

function buildGradient(metric: AreaAnalyticsMetricKey, theme: AreaAnalyticsColorTheme): string {
    const colors = COLOR_SCHEMES[theme].map((s) => s.color);
    if (metric === 'speed') colors.reverse();
    return `linear-gradient(to right, ${colors.join(', ')})`;
}

export function updateLegend(metric: AreaAnalyticsMetricKey, theme: AreaAnalyticsColorTheme = 'congestion'): void {
    const { title, min, max } = LEGEND_LABELS[metric];
    $('legend-title').textContent = title;
    $('legend-bar').style.background = buildGradient(metric, theme);
    $('legend-min').textContent = min;
    $('legend-max').textContent = max;
}

export function updateStats(metrics: AreaAnalyticsMetrics): void {
    $('stat-congestion').textContent = `${Math.round(metrics.congestionLevel ?? 0)}%`;
    $('stat-speed').textContent = `${Math.round(metrics.speed ?? 0)} km/h`;
    $('stat-traveltime').textContent =
        metrics.travelTime != null ? `${(Math.round(metrics.travelTime * 10) / 10).toFixed(1)} min/10km` : '--';
    $('stat-freeflow').textContent = metrics.freeFlowSpeed != null ? `${Math.round(metrics.freeFlowSpeed)} km/h` : '--';
}

export function wireRadioGroup(selector: string, onChange: (value: string) => void): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(`${selector} .sdk-example-toggle`);
    for (const btn of buttons) {
        btn.addEventListener('click', () => {
            for (const b of buttons) b.classList.remove('active');
            btn.classList.add('active');
            if (btn.dataset.value) onChange(btn.dataset.value);
        });
    }
}
