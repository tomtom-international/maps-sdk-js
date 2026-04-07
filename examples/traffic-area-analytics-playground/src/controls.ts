import type { AreaAnalyticsMetricKey, AreaAnalyticsMetrics } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorStopsConfig } from '@tomtom-org/maps-sdk/map';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const LEGEND_LABELS: Record<AreaAnalyticsMetricKey, { title: string; min: string; max: string }> = {
    congestionLevel: { title: 'Congestion Level', min: 'Free', max: 'Standstill' },
    speed: { title: 'Speed', min: 'Slow', max: 'Fast' },
    travelTime: { title: 'Travel Time', min: 'Short', max: 'Long' },
    freeFlowSpeed: { title: 'Free Flow Speed', min: 'Slow', max: 'Fast' },
    networkLength: { title: 'Network Length (road density)', min: 'Low', max: 'High' },
};

export const updateLegend = (metric: AreaAnalyticsMetricKey, colorConfig?: AreaAnalyticsColorStopsConfig): void => {
    const { title, min, max } = LEGEND_LABELS[metric];
    const colors = colorConfig?.stops.map((s) => s.color) ?? ['#2dc653', '#f5a623', '#e03030'];
    $('legend-title').textContent = title;
    $('legend-bar').style.background = `linear-gradient(to right, ${colors.join(', ')})`;
    $('legend-min').textContent = min;
    $('legend-max').textContent = max;
};

export const updateStats = (metrics: AreaAnalyticsMetrics): void => {
    $('stat-congestion').textContent = `${Math.round(metrics.congestionLevel ?? 0)}%`;
    $('stat-speed').textContent = `${Math.round(metrics.speed ?? 0)} km/h`;
    $('stat-traveltime').textContent =
        metrics.travelTime != null ? `${(Math.round(metrics.travelTime * 10) / 10).toFixed(1)} min/10km` : '--';
    $('stat-freeflow').textContent = metrics.freeFlowSpeed != null ? `${Math.round(metrics.freeFlowSpeed)} km/h` : '--';
};
