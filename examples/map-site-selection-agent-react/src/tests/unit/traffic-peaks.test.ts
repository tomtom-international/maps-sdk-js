import type { AreaAnalyticsAverageEntry } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { MORNING_HOURS, utcOffsetHours, weekdayPeakCongestion } from '../../agent/traffic-peaks';

// A full average week labelled in UTC, as Area Analytics sends it: congestion 50 from 05:00 to 07:00
// UTC on weekdays, which is 07:00 to 09:00 in Amsterdam summer time, and 10 at every other hour.
const averageWeek: AreaAnalyticsAverageEntry[] = ([1, 2, 3, 4, 5, 6, 7] as const).flatMap((day) =>
    Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        congestionLevel: day <= 5 && hour >= 5 && hour <= 7 ? 50 : 10,
    })),
);

describe('utcOffsetHours', () => {
    it('reads the offset of the date it is given, summer or winter', () => {
        expect(utcOffsetHours('Europe/Amsterdam', new Date('2026-09-25'))).toBe(2);
        expect(utcOffsetHours('Europe/Amsterdam', new Date('2026-12-01'))).toBe(1);
        expect(utcOffsetHours('America/Los_Angeles', new Date('2026-09-25'))).toBe(-7);
        expect(utcOffsetHours('UTC', new Date('2026-09-25'))).toBe(0);
    });
});

describe('weekdayPeakCongestion', () => {
    it('averages the hours on the site clock, not the UTC labels', () => {
        expect(weekdayPeakCongestion(averageWeek, MORNING_HOURS, 2)).toBe(50);
        expect(weekdayPeakCongestion(averageWeek, MORNING_HOURS, 0)).toBe(23);
    });

    it('moves an entry across midnight into the weekday it falls on locally', () => {
        // Friday 23:00 UTC is Saturday 01:00 in Amsterdam, and Sunday 23:00 UTC is Monday 01:00.
        const lateEntries: AreaAnalyticsAverageEntry[] = [
            { day: 5, hour: 23, congestionLevel: 80 },
            { day: 7, hour: 23, congestionLevel: 20 },
        ];
        expect(weekdayPeakCongestion(lateEntries, [1], 2)).toBe(20);
    });

    it('is null when no weekday entry falls in the hours', () => {
        expect(weekdayPeakCongestion([], MORNING_HOURS, 2)).toBeNull();
    });
});
