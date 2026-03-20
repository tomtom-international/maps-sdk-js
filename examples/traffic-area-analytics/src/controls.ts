import type { AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/map';

const $ = (id: string) => document.getElementById(id)!;

// ── Legend config ────────────────────────────────────────────────────
const LEGEND: Record<AreaAnalyticsMetricKey, { title: string; min: string; max: string; gradient: string }> = {
    congestionLevel: {
        title: 'Congestion Level', min: 'Free', max: 'Standstill',
        gradient: 'linear-gradient(to right, #2dc653, #f5a623, #e03030, #8b0000)',
    },
    speed: {
        title: 'Speed', min: 'Slow', max: 'Fast',
        gradient: 'linear-gradient(to right, #8b0000, #e03030, #f5a623, #2dc653)',
    },
    travelTime: {
        title: 'Travel Time', min: 'Short', max: 'Long',
        gradient: 'linear-gradient(to right, #2dc653, #f5a623, #e03030, #8b0000)',
    },
};

export function updateLegend(metric: AreaAnalyticsMetricKey): void {
    const cfg = LEGEND[metric];
    $('legend-title').textContent = cfg.title;
    $('legend-bar').style.background = cfg.gradient;
    $('legend-min').textContent = cfg.min;
    $('legend-max').textContent = cfg.max;
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
