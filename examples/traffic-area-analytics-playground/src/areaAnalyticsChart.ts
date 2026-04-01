import type { AreaAnalyticsTimedEntry } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsColorTheme } from '@tomtom-org/maps-sdk/map';
import { COLOR_SCHEMES } from '@tomtom-org/maps-sdk/map';

// Converts a hex color string (#RRGGBB) into an [r, g, b] byte tuple.
function parseHex(hex: string): [number, number, number] {
    const hexValue = hex.replace('#', '');
    return [
        Number.parseInt(hexValue.slice(0, 2), 16),
        Number.parseInt(hexValue.slice(2, 4), 16),
        Number.parseInt(hexValue.slice(4, 6), 16),
    ];
}

// Linearly interpolates between two RGB colors.
// t = 0 returns a; t = 1 returns b; values in between are blended channel-by-channel.
function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const blue = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${blue})`;
}

// Maps a 0–100 congestion value to a CSS color by interpolating through the theme's color stops.
// The value is first normalized to [0, 1], then the stop pair that brackets it is found and
// lerpColor blends between them. Falls back to the last stop color when value === 100.
function metricColor(value: number, colorTheme: AreaAnalyticsColorTheme): string {
    const t = Math.max(0, Math.min(100, value)) / 100;
    const stops = COLOR_SCHEMES[colorTheme];

    for (let i = 0; i < stops.length - 1; i++) {
        const stop0 = stops[i];
        const stop1 = stops[i + 1];

        if (t <= stop1.value) {
            const ratio = (t - stop0.value) / (stop1.value - stop0.value);
            return lerpColor(parseHex(stop0.color), parseHex(stop1.color), ratio);
        }
    }

    return stops[stops.length - 1].color;
}

function addDaysToDateStr(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDayLabel(isoDate: string): string {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const NUM_HOURS = 24;

/**
 * Renders a day × hour congestion heatmap chart into a plain HTML element
 * using a CSS grid of `<div>` cells — no canvas required.
 *
 * Treats `entries` as a flat sequential array (index 0 = day 0 hour 0,
 * index 1 = day 0 hour 1, etc.). Uses `startDate` to compute day labels.
 *
 * @param container - Target element; its contents are replaced on each call.
 * @param entries - Sequential hourly entries (168 = 7 days × 24 hours).
 * @param startDate - ISO date string (YYYY-MM-DD) for the first day.
 * @param colorTheme - Color theme preset (default: `'congestion'`).
 */
export function renderAreaAnalyticsChart(
    container: HTMLElement,
    entries: AreaAnalyticsTimedEntry[],
    startDate: string,
    colorTheme: AreaAnalyticsColorTheme = 'congestion',
): void {
    if (entries.length === 0) return;

    const numDays = Math.ceil(entries.length / NUM_HOURS);
    container.innerHTML = '';
    container.className = 'aa-chart';

    // Corner spacer (aligns with day labels)
    const corner = document.createElement('div');
    corner.className = 'aa-chart-corner';
    container.appendChild(corner);

    // Hour labels row
    for (let hour = 0; hour < NUM_HOURS; hour++) {
        const label = document.createElement('div');
        label.className = 'aa-chart-hour-label';
        label.textContent = hour % 3 === 0 ? `${hour}h` : '';
        container.appendChild(label);
    }

    // One row per day
    for (let day = 0; day < numDays; day++) {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'aa-chart-day-label';
        dayLabel.textContent = formatDayLabel(addDaysToDateStr(startDate, day));
        container.appendChild(dayLabel);

        for (let hour = 0; hour < NUM_HOURS; hour++) {
            const entryIndex = day * NUM_HOURS + hour;
            const entry = entries[entryIndex];
            const value = entry?.congestionLevel ?? 0;

            const cell = document.createElement('div');
            cell.className = 'aa-chart-cell';
            cell.style.backgroundColor = metricColor(value, colorTheme);
            cell.title = `${formatDayLabel(addDaysToDateStr(startDate, day))} ${hour}:00 — ${Math.round(value)}%`;

            if (value > 0) {
                cell.textContent = `${Math.round(value)}`;
                cell.style.color = value > 60 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
            }

            container.appendChild(cell);
        }
    }
}
