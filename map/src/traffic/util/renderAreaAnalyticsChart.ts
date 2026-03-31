import type { AreaAnalyticsTimedEntry } from '@tomtom-org/maps-sdk/core';
import { COLOR_SCHEMES } from '../layers/areaAnalyticsLayers';
import type { AreaAnalyticsColorTheme } from '../types/trafficAreaAnalyticsConfig';

/** Parses a hex color string (#RRGGBB) into [r, g, b]. */
function parseHex(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [Number.parseInt(h.slice(0, 2), 16), Number.parseInt(h.slice(2, 4), 16), Number.parseInt(h.slice(4, 6), 16)];
}

/** Linearly interpolates between two [r,g,b] colors at ratio t (0–1). */
function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
}

/** Interpolates a 0–100 congestion value through the color stops of the given theme. */
function metricColor(value: number, theme: AreaAnalyticsColorTheme = 'congestion'): string {
    const t = Math.max(0, Math.min(100, value)) / 100; // normalize to 0-1
    const stops = COLOR_SCHEMES[theme];

    for (let i = 0; i < stops.length - 1; i++) {
        const s0 = stops[i];
        const s1 = stops[i + 1];
        if (t <= s1.value) {
            const ratio = (t - s0.value) / (s1.value - s0.value);
            return lerpColor(parseHex(s0.color), parseHex(s1.color), ratio);
        }
    }

    return stops[stops.length - 1].color;
}

/** Grid cell dimensions (px). */
const CELL_W = 20;
const CELL_H = 20;
/** Space reserved for day labels on the left. */
const LABEL_LEFT = 56;
/** Space reserved for hour labels at the top. */
const LABEL_TOP = 20;

function addDaysToDateStr(isoDate: string, days: number): string {
    const d = new Date(`${isoDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDayLabel(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Renders a day × hour congestion heatmap chart on a `<canvas>`.
 *
 * Treats `entries` as a flat sequential array (index 0 = day 0 hour 0,
 * index 1 = day 0 hour 1, etc.). Uses `startDate` to compute day labels.
 *
 * @param canvas - Target canvas element.
 * @param entries - Sequential hourly entries (168 = 7 days × 24 hours).
 * @param startDate - ISO date string (YYYY-MM-DD) for the first day.
 * @param colorTheme - Color theme preset (default: `'congestion'`).
 *
 * @group Traffic Area Analytics
 */
export function renderAreaAnalyticsChart(
    canvas: HTMLCanvasElement,
    entries: AreaAnalyticsTimedEntry[],
    startDate: string,
    colorTheme: AreaAnalyticsColorTheme = 'congestion',
): void {
    if (entries.length === 0) return;

    const numHours = 24;
    const numDays = Math.ceil(entries.length / numHours);

    // Build grid from sequential entries
    const grid: number[][] = [];
    const dayLabels: string[] = [];

    for (let d = 0; d < numDays; d++) {
        const row: number[] = [];
        for (let h = 0; h < numHours; h++) {
            const idx = d * numHours + h;
            const entry = entries[idx];
            row.push(entry?.congestionLevel ?? 0);
        }
        grid.push(row);
        dayLabels.push(formatDayLabel(addDaysToDateStr(startDate, d)));
    }

    const width = LABEL_LEFT + numHours * CELL_W + 8;
    const height = LABEL_TOP + numDays * CELL_H + 4;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);

    const fontStack = 'Gilroy, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Hour labels (every 3h)
    ctx.font = `10px ${fontStack}`;
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    for (let h = 0; h < numHours; h += 3) {
        ctx.fillText(`${h}h`, LABEL_LEFT + h * CELL_W + CELL_W / 2, LABEL_TOP - 5);
    }

    // Day rows
    for (let d = 0; d < numDays; d++) {
        const y = LABEL_TOP + d * CELL_H;

        // Day label
        ctx.font = `9px ${fontStack}`;
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(dayLabels[d], LABEL_LEFT - 4, y + CELL_H / 2);

        // Cells
        for (let h = 0; h < numHours; h++) {
            const x = LABEL_LEFT + h * CELL_W;
            const value = grid[d][h];

            ctx.fillStyle = metricColor(value, colorTheme);
            ctx.fillRect(x, y, CELL_W - 1, CELL_H - 1);

            // Overlay value
            if (value > 0) {
                ctx.font = `8px ${fontStack}`;
                ctx.fillStyle = value > 60 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.round(value)}`, x + CELL_W / 2, y + CELL_H / 2);
            }
        }
    }
}
