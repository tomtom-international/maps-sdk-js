import type { AreaAnalyticsHourlyEntry } from '@tomtom-org/maps-sdk/core';
import { ALL_HOURS } from './filters';

// Converts a hex color string (#RRGGBB) into an [r, g, b] byte tuple.
const parseHex = (hex: string): [number, number, number] => {
    const hexValue = hex.replace('#', '');
    return [
        Number.parseInt(hexValue.slice(0, 2), 16),
        Number.parseInt(hexValue.slice(2, 4), 16),
        Number.parseInt(hexValue.slice(4, 6), 16),
    ];
};

// Linearly interpolates between two RGB colors.
// A ratio of 0 returns `from`, 1 returns `to`; values in between are blended channel-by-channel.
const lerpColor = (from: [number, number, number], to: [number, number, number], ratio: number): string => {
    const red = Math.round(from[0] + (to[0] - from[0]) * ratio);
    const green = Math.round(from[1] + (to[1] - from[1]) * ratio);
    const blue = Math.round(from[2] + (to[2] - from[2]) * ratio);
    return `rgb(${red},${green},${blue})`;
};

// Maps a 0–100 congestion value to a CSS color by interpolating through the given color stops.
// The value is first normalized to [0, 1], then the stop pair that brackets it is found and
// lerpColor blends between them. Falls back to the last stop color when value === 100.
const metricColor = (value: number, colors: string[]): string => {
    const t = Math.max(0, Math.min(100, value)) / 100;

    for (let i = 0; i < colors.length - 1; i++) {
        const pos0 = i / (colors.length - 1);
        const pos1 = (i + 1) / (colors.length - 1);

        if (t <= pos1) {
            const ratio = (t - pos0) / (pos1 - pos0);
            return lerpColor(parseHex(colors[i]), parseHex(colors[i + 1]), ratio);
        }
    }

    return colors[colors.length - 1];
};

// Each entry's date is its calendar day at midnight UTC.
const formatDayLabel = (date: Date): string =>
    date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

type EntriesByHour = Map<number, AreaAnalyticsHourlyEntry>;

// Groups the entries by day, keyed by that day's timestamp, then by hour; days keep the entries' chronological order.
const groupByDayAndHour = (entries: AreaAnalyticsHourlyEntry[]): Map<number, EntriesByHour> => {
    const entriesByDay = new Map<number, EntriesByHour>();
    for (const entry of entries) {
        const dayTime = entry.date.getTime();
        const entriesByHour: EntriesByHour = entriesByDay.get(dayTime) ?? new Map();
        entriesByHour.set(entry.hour, entry);
        entriesByDay.set(dayTime, entriesByHour);
    }
    return entriesByDay;
};

/**
 * Renders a day × hour congestion heatmap chart into a plain HTML element
 * using a CSS grid of `<div>` cells, no canvas required.
 *
 * Places each entry by its own `date` and `hour`, both in UTC: one row per day with data, one column per hour,
 * and an empty cell for an hour the response has no entry for, such as one the hours filter left out.
 *
 * @param container - Target element; its contents are replaced on each call.
 * @param entries - Hourly entries, as in `timedData.hourly`.
 * @param colorStops - Ordered CSS color strings for the congestion ramp (low → high).
 */
export const renderAreaAnalyticsChart = (
    container: HTMLElement,
    entries: AreaAnalyticsHourlyEntry[],
    colorStops: string[],
): void => {
    if (entries.length === 0) return;

    container.innerHTML = '';
    container.className = 'aa-chart';

    // Corner spacer (aligns with day labels)
    const corner = document.createElement('div');
    corner.className = 'aa-chart-corner';
    container.appendChild(corner);

    // Hour labels row
    for (const hour of ALL_HOURS) {
        const label = document.createElement('div');
        label.className = 'aa-chart-hour-label';
        label.textContent = hour % 3 === 0 ? `${hour}h` : '';
        container.appendChild(label);
    }

    // One row per day
    for (const [dayTime, entriesByHour] of groupByDayAndHour(entries)) {
        const dayText = formatDayLabel(new Date(dayTime));
        const dayLabel = document.createElement('div');
        dayLabel.className = 'aa-chart-day-label';
        dayLabel.textContent = dayText;
        container.appendChild(dayLabel);

        for (const hour of ALL_HOURS) {
            const value = entriesByHour.get(hour)?.congestionLevel;
            const cell = document.createElement('div');
            cell.className = 'aa-chart-cell';

            if (value === undefined) {
                cell.classList.add('aa-chart-cell-empty');
                cell.title = `${dayText} ${hour}:00 UTC: no data`;
            } else {
                cell.style.backgroundColor = metricColor(value, colorStops);
                cell.title = `${dayText} ${hour}:00 UTC: ${Math.round(value)}%`;

                if (value > 0) {
                    cell.textContent = `${Math.round(value)}`;
                    cell.style.color = value > 60 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
                }
            }

            container.appendChild(cell);
        }
    }
};
