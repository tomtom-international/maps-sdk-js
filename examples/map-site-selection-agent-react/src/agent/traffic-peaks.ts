import type { AreaAnalyticsAverageEntry } from '@tomtom-org/maps-sdk/core';

// Weekday rush hours on the site's own clock.
export const MORNING_HOURS: readonly number[] = [7, 8, 9];
export const EVENING_HOURS: readonly number[] = [16, 17, 18];

const WEEKDAYS = [1, 2, 3, 4, 5];
const HOURS_PER_WEEK = 7 * 24;

/**
 * A time zone's offset from UTC at `at`, rounded to whole hours: 2 for Europe/Amsterdam in summer.
 * Area Analytics bins traffic by whole UTC hour, so a half- or quarter-hour zone (Asia/Kolkata, +5:30)
 * reads each local hour from a UTC bin up to 30 minutes off.
 */
export const utcOffsetHours = (timeZone: string, at: Date): number => {
    const offset = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
        .formatToParts(at)
        .find((part) => part.type === 'timeZoneName')?.value;
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset ?? '');
    if (!match) return 0;

    const hours = Number(match[2]) + Number(match[3]) / 60;
    return Math.round(match[1] === '-' ? -hours : hours);
};

/**
 * Mean weekday congestion over `hours` of the site's day, or null when no entry falls in them.
 * Area Analytics labels its average week in UTC, so each entry first moves `offsetHours` onto the
 * site's clock: a Monday 05:00 UTC entry is Monday 07:00 in Amsterdam summer time.
 */
export const weekdayPeakCongestion = (
    average: readonly AreaAnalyticsAverageEntry[],
    hours: readonly number[],
    offsetHours: number,
): number | null => {
    const congestion: number[] = [];
    for (const entry of average) {
        if (entry.congestionLevel === undefined) continue;

        const hourOfWeek =
            ((((entry.day - 1) * 24 + entry.hour + offsetHours) % HOURS_PER_WEEK) + HOURS_PER_WEEK) % HOURS_PER_WEEK;
        const day = Math.floor(hourOfWeek / 24) + 1;
        if (WEEKDAYS.includes(day) && hours.includes(hourOfWeek % 24)) congestion.push(entry.congestionLevel);
    }
    if (congestion.length === 0) return null;

    return Math.round(congestion.reduce((sum, value) => sum + value, 0) / congestion.length);
};
