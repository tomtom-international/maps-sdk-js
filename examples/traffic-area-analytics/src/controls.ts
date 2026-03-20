import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorScheme, AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/map';
import { COLOR_SCHEMES } from '@tomtom-org/maps-sdk/map';

const $ = (id: string) => document.getElementById(id)!;

// ── Legend config ────────────────────────────────────────────────────
const LEGEND_LABELS: Record<AreaAnalyticsMetricKey, { title: string; min: string; max: string }> = {
    congestionLevel: { title: 'Congestion Level', min: 'Free', max: 'Standstill' },
    speed: { title: 'Speed', min: 'Slow', max: 'Fast' },
    travelTime: { title: 'Travel Time', min: 'Short', max: 'Long' },
};

function buildGradient(metric: AreaAnalyticsMetricKey, scheme: AreaAnalyticsColorScheme): string {
    const { low, mid, high } = COLOR_SCHEMES[scheme];
    if (metric === 'speed') {
        return `linear-gradient(to right, ${high}, ${mid}, ${low})`;
    }
    return `linear-gradient(to right, ${low}, ${mid}, ${high})`;
}

export function updateLegend(metric: AreaAnalyticsMetricKey, scheme: AreaAnalyticsColorScheme = 'congestion'): void {
    const labels = LEGEND_LABELS[metric];
    $('legend-title').textContent = labels.title;
    $('legend-bar').style.background = buildGradient(metric, scheme);
    $('legend-min').textContent = labels.min;
    $('legend-max').textContent = labels.max;
}

export function updateStats(b: AreaAnalyticsMetrics): void {
    $('stat-congestion').textContent = `${Math.round(b.congestionLevel ?? 0)}%`;
    $('stat-speed').textContent = `${Math.round(b.speed ?? 0)} km/h`;
    $('stat-traveltime').textContent = b.travelTime != null ? `${(Math.round(b.travelTime * 10) / 10).toFixed(1)} min/10km` : '--';
    $('stat-freeflow').textContent = b.freeFlowSpeed != null ? `${Math.round(b.freeFlowSpeed)} km/h` : '--';
}

export function wireRadioGroup(selector: string, onChange: (value: string) => void): void {
    const options = document.querySelectorAll<HTMLElement>(`${selector} .aa-radio-option`);
    for (const opt of options) {
        opt.addEventListener('click', () => {
            for (const o of options) o.classList.remove('aa-radio-active');
            opt.classList.add('aa-radio-active');
            const radio = opt.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radio) { radio.checked = true; onChange(radio.value); }
        });
    }
}
