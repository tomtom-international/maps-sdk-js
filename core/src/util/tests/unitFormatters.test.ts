import { beforeEach, describe, expect, test } from 'vitest';
import { TomTomConfig } from '../../config/globalConfig';
import { formatDistance, formatDuration } from '../unitFormatters';

describe('Unit formatters tests', () => {
    beforeEach(() => TomTomConfig.instance.reset());

    test('format duration', () => {
        expect(formatDuration(0)).toBeUndefined();
        expect(formatDuration(20)).toBeUndefined();
        expect(formatDuration(30)).toBe('1 min');
        expect(formatDuration(60)).toBe('1 min');
        expect(formatDuration(100)).toBe('2 min');
        expect(formatDuration(3600)).toBe('1 hr 00 min');
        expect(formatDuration(3599)).toBe('1 hr 00 min');
        expect(formatDuration(3540)).toBe('59 min');
        expect(formatDuration(3570)).toBe('1 hr 00 min');
        expect(formatDuration(3660)).toBe('1 hr 01 min');
        expect(formatDuration(36120)).toBe('10 hr 02 min');
    });

    test('format duration with options', () => {
        // Override display units via parameter:
        expect(formatDuration(30, { minutes: 'MIN.' })).toBe('1 MIN.');
        expect(formatDuration(3600, { hours: 'HR.', minutes: 'MIN.' })).toBe('1 HR. 00 MIN.');
        expect(formatDuration(36120, { hours: 'HR' })).toBe('10 HR 02 min');

        // Override display units via global config (and parameters):
        TomTomConfig.instance.put({ displayUnits: { time: { hours: 'hours', minutes: 'minutes' } } });
        expect(formatDuration(240)).toBe('4 minutes');
        expect(formatDuration(3600)).toBe('1 hours 00 minutes');
        expect(formatDuration(3600, { minutes: 'MIN' })).toBe('1 hours 00 MIN');
        expect(formatDuration(3600, { hours: 'HR' })).toBe('1 HR 00 minutes');

        TomTomConfig.instance.put({ displayUnits: { time: { hours: 'HR' } } });
        expect(formatDuration(3600)).toBe('1 HR 00 min');
        TomTomConfig.instance.put({ displayUnits: { time: { minutes: 'MINUTES' } } });
        expect(formatDuration(3600)).toBe('1 hr 00 MINUTES');
    });

    test('format distance', () => {
        expect(formatDistance(0)).toBe('0 m');
        expect(formatDistance(2)).toBe('2 m');
        expect(formatDistance(1000)).toBe('1 km');
        expect(formatDistance(0, { type: 'metric' })).toBe('0 m');
        expect(formatDistance(2, { type: 'metric' })).toBe('2 m');
        expect(formatDistance(2.6, { type: 'metric' })).toBe('2.6 m');
        expect(formatDistance(232, { type: 'metric' })).toBe('230 m');
        expect(formatDistance(237, { type: 'metric' })).toBe('240 m');
        expect(formatDistance(730, { type: 'metric' })).toBe('700 m');
        expect(formatDistance(850, { type: 'metric' })).toBe('900 m');
        expect(formatDistance(949, { type: 'metric' })).toBe('900 m');
        expect(formatDistance(950, { type: 'metric' })).toBe('1 km');
        expect(formatDistance(999, { type: 'metric' })).toBe('1 km');
        expect(formatDistance(1000, { type: 'metric' })).toBe('1 km');
        expect(formatDistance(1024, { type: 'metric' })).toBe('1 km');
        expect(formatDistance(1099, { type: 'metric' })).toBe('1.1 km');
        expect(formatDistance(1100, { type: 'metric' })).toBe('1.1 km');
        expect(formatDistance(1830, { type: 'metric' })).toBe('1.8 km');
        expect(formatDistance(2850, { type: 'metric' })).toBe('2.9 km');
        expect(formatDistance(283520, { type: 'metric' })).toBe('284 km');
        expect(formatDistance(2830100, { type: 'metric' })).toBe('2830 km');
        expect(formatDistance(2, { type: 'imperial_us' })).toBe('7 ft');
        expect(formatDistance(100, { type: 'imperial_us' })).toBe('330 ft');
        expect(formatDistance(151.87, { type: 'imperial_us' })).toBe('500 ft');
        expect(formatDistance(168.64, { type: 'imperial_us' })).toBe('600 ft');
        expect(formatDistance(182.88, { type: 'imperial_us' })).toBe('600 ft');
        expect(formatDistance(205.95, { type: 'imperial_us' })).toBe('¼ mi');
        expect(formatDistance(800.95, { type: 'imperial_us' })).toBe('½ mi');
        expect(formatDistance(1205.95, { type: 'imperial_us' })).toBe('¾ mi');
        expect(formatDistance(1700, { type: 'imperial_us' })).toBe('1 mi');
        expect(formatDistance(1855.95, { type: 'imperial_us' })).toBe('1¼ mi');
        expect(formatDistance(2413.5, { type: 'imperial_us' })).toBe('1½ mi');
        expect(formatDistance(4344.3, { type: 'imperial_us' })).toBe('2¾ mi');
        expect(formatDistance(4633.92, { type: 'imperial_us' })).toBe('3 mi');
        expect(formatDistance(4987.9, { type: 'imperial_us' })).toBe('3 mi');
        expect(formatDistance(5309.7, { type: 'imperial_us' })).toBe('3½ mi');
        expect(formatDistance(9332.2, { type: 'imperial_us' })).toBe('6 mi');
        expect(formatDistance(18181.7, { type: 'imperial_us' })).toBe('11 mi');
        expect(formatDistance(21753.68, { type: 'imperial_us' })).toBe('14 mi');
        expect(formatDistance(2, { type: 'imperial_uk' })).toBe('2 yd');
        expect(formatDistance(150.88, { type: 'imperial_uk' })).toBe('170 yd');
        expect(formatDistance(205.95, { type: 'imperial_uk' })).toBe('¼ mi');
        expect(formatDistance(2413.5, { type: 'imperial_uk' })).toBe('1½ mi');
        expect(formatDistance(4344.3, { type: 'imperial_uk' })).toBe('2¾ mi');
        expect(formatDistance(4633.92, { type: 'imperial_uk' })).toBe('3 mi');
        expect(formatDistance(4987.9, { type: 'imperial_uk' })).toBe('3 mi');
        expect(formatDistance(5309.7, { type: 'imperial_uk' })).toBe('3½ mi');
        expect(formatDistance(9332.2, { type: 'imperial_uk' })).toBe('6 mi');
        expect(formatDistance(18181.7, { type: 'imperial_uk' })).toBe('11 mi');
        expect(formatDistance(21753.68, { type: 'imperial_uk' })).toBe('14 mi');

        expect(formatDistance(-2, { type: 'metric' })).toBe('-2 m');
        expect(formatDistance(-232, { type: 'metric' })).toBe('-230 m');
        expect(formatDistance(-237, { type: 'metric' })).toBe('-240 m');
        expect(formatDistance(-730, { type: 'metric' })).toBe('-700 m');
        expect(formatDistance(-850, { type: 'metric' })).toBe('-800 m');
        expect(formatDistance(-949, { type: 'metric' })).toBe('-900 m');
        expect(formatDistance(-950, { type: 'metric' })).toBe('-900 m');
        expect(formatDistance(-999, { type: 'metric' })).toBe('-1 km');
        expect(formatDistance(-1000, { type: 'metric' })).toBe('-1 km');
        expect(formatDistance(-1024, { type: 'metric' })).toBe('-1 km');
        expect(formatDistance(-1099, { type: 'metric' })).toBe('-1.1 km');
        expect(formatDistance(-1100, { type: 'metric' })).toBe('-1.1 km');
        expect(formatDistance(-1830, { type: 'metric' })).toBe('-1.8 km');
        expect(formatDistance(-2850, { type: 'metric' })).toBe('-2.8 km');
        expect(formatDistance(-283520, { type: 'metric' })).toBe('-284 km');
        expect(formatDistance(-2830100, { type: 'metric' })).toBe('-2830 km');
        expect(formatDistance(-2, { type: 'imperial_us' })).toBe('-7 ft');
        expect(formatDistance(-100, { type: 'imperial_us' })).toBe('-330 ft');
        expect(formatDistance(-151.87, { type: 'imperial_us' })).toBe('-500 ft');
        expect(formatDistance(-168.64, { type: 'imperial_us' })).toBe('-600 ft');
        expect(formatDistance(-182.88, { type: 'imperial_us' })).toBe('-600 ft');
        expect(formatDistance(-205.95, { type: 'imperial_us' })).toBe('-¼ mi');
        expect(formatDistance(-805.95, { type: 'imperial_us' })).toBe('-½ mi');
        expect(formatDistance(-1205.95, { type: 'imperial_us' })).toBe('-¾ mi');
        expect(formatDistance(-1700, { type: 'imperial_us' })).toBe('-1 mi');
        expect(formatDistance(-2413.5, { type: 'imperial_us' })).toBe('-1½ mi');
        expect(formatDistance(-4344.3, { type: 'imperial_us' })).toBe('-2¾ mi');
        expect(formatDistance(-4633.92, { type: 'imperial_us' })).toBe('-3 mi');
        expect(formatDistance(-4987.9, { type: 'imperial_us' })).toBe('-3 mi');
        expect(formatDistance(-5309.7, { type: 'imperial_us' })).toBe('-3½ mi');
        expect(formatDistance(-9332.2, { type: 'imperial_us' })).toBe('-6 mi');
        expect(formatDistance(-18181.7, { type: 'imperial_us' })).toBe('-11 mi');
        expect(formatDistance(-21753.68, { type: 'imperial_us' })).toBe('-14 mi');
        expect(formatDistance(-2, { type: 'imperial_uk' })).toBe('-2 yd');
        expect(formatDistance(-150.88, { type: 'imperial_uk' })).toBe('-160 yd');
        expect(formatDistance(-205.95, { type: 'imperial_uk' })).toBe('-¼ mi');
        expect(formatDistance(-2413.5, { type: 'imperial_uk' })).toBe('-1½ mi');
        expect(formatDistance(-4344.3, { type: 'imperial_uk' })).toBe('-2¾ mi');
        expect(formatDistance(-4633.92, { type: 'imperial_uk' })).toBe('-3 mi');
        expect(formatDistance(-4987.9, { type: 'imperial_uk' })).toBe('-3 mi');
        expect(formatDistance(-5309.7, { type: 'imperial_uk' })).toBe('-3½ mi');
        expect(formatDistance(-9332.2, { type: 'imperial_uk' })).toBe('-6 mi');
        expect(formatDistance(-18181.7, { type: 'imperial_uk' })).toBe('-11 mi');
        expect(formatDistance(-21753.68, { type: 'imperial_uk' })).toBe('-14 mi');
    });

    test('format distance with extra options', () => {
        // Override display units via parameter:
        expect(formatDistance(3000, { kilometers: 'kilòmetres' })).toBe('3 kilòmetres');
        expect(formatDistance(3000, { type: 'metric', kilometers: 'kilòmetres' })).toBe('3 kilòmetres');
        expect(formatDistance(-100, { type: 'imperial_us', feet: 'feet' })).toBe('-330 feet');
        expect(
            formatDistance(-100, { type: 'imperial_us', kilometers: 'kilometers', feet: 'feet', yards: 'yards' }),
        ).toBe('-330 feet');
        expect(formatDistance(-150.88, { type: 'imperial_uk', yards: 'yards' })).toBe('-160 yards');

        // Override display units via global config (and parameters):
        TomTomConfig.instance.put({ displayUnits: { distance: { type: 'imperial_us' } } });
        expect(formatDistance(100)).toBe('330 ft');
        expect(formatDistance(100, { feet: 'feet' })).toBe('330 feet');

        TomTomConfig.instance.put({
            displayUnits: { distance: { type: 'imperial_uk', yards: 'yards', meters: 'meters' } },
        });
        expect(formatDistance(150.88)).toBe('170 yards');
        expect(formatDistance(150.88, { type: 'metric' })).toBe('150 meters');
    });
});
