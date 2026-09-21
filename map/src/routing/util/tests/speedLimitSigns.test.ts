import type { SpeedLimitSectionProps } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { DisplayRouteProps } from '../../types/displayRoutes';
import { toDisplaySpeedLimitSectionProps } from '../speedLimitSigns';

const INSTANCE_INDEX = 0;

const limit = (maxSpeedLimitInKmh: number): SpeedLimitSectionProps => ({
    id: 'limit-0',
    startPointIndex: 0,
    endPointIndex: 4,
    maxSpeedLimitInKmh,
});

const limitFrom = (startPointIndex: number, maxSpeedLimitInKmh: number): SpeedLimitSectionProps => ({
    id: `limit-${startPointIndex}`,
    startPointIndex,
    endPointIndex: startPointIndex + 4,
    maxSpeedLimitInKmh,
});

// Only the country sections matter here: they are what the mapper reads off the route.
const routeIn = (countryCodeISO3: string): DisplayRouteProps =>
    ({
        sections: { country: [{ id: 'country-0', startPointIndex: 0, endPointIndex: 9, countryCodeISO3 }] },
    }) as unknown as DisplayRouteProps;

// Two countries tiling one route, so a section can be placed either side of the border.
const routeCrossing = (before: string, after: string): DisplayRouteProps =>
    ({
        sections: {
            country: [
                { id: 'country-0', startPointIndex: 0, endPointIndex: 9, countryCodeISO3: before },
                { id: 'country-1', startPointIndex: 10, endPointIndex: 19, countryCodeISO3: after },
            ],
        },
    }) as unknown as DisplayRouteProps;

describe('the sign a speed limit section is posted on', () => {
    test('a country with no entry of its own posts the white disc in km/h', () => {
        const sign = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(100), routeIn('NLD'));

        expect(sign.signFace).toBe('whiteDisc');
        expect(sign.signLabel).toBe('100');
        expect(sign.signImageID).toBe('routeSpeedLimitWhiteDisc-0');
        expect(sign.signNumeralsColor).toBe('#1A2024');
    });

    test('a country posting mph converts the number and rounds it to the step signs come in', () => {
        // 112 km/h is a 70 sign: neither the 112 an unconverted number would read nor the 69 an
        // unrounded conversion would.
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(112), routeIn('GBR')).signLabel).toBe('70');
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(48), routeIn('GBR')).signLabel).toBe('30');
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(105), routeIn('USA')).signLabel).toBe('65');
    });

    test('the face and the numerals follow the country, not the reader', () => {
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(105), routeIn('USA')).signFace).toBe('plaque');
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(70), routeIn('SWE')).signFace).toBe('yellowDisc');
        expect(toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(60), routeIn('JPN')).signNumeralsColor).toBe(
            '#0B5FA5',
        );
    });

    test('a stretch takes the country it starts in, so a border switches the unit', () => {
        const crossing = routeCrossing('NLD', 'GBR');
        const sign = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX);

        // The same 112 km/h either side of the crossing: the number itself in the Netherlands, and
        // the 70 the United Kingdom posts for it.
        expect(sign(limitFrom(2, 112), crossing).signLabel).toBe('112');
        expect(sign(limitFrom(12, 112), crossing).signLabel).toBe('70');
    });

    test('the face switches at the border too', () => {
        // A real Nordic crossing: Sweden posts the yellow disc, Norway the white one.
        const crossing = routeCrossing('SWE', 'NOR');
        const sign = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX);

        expect(sign(limitFrom(2, 70), crossing).signFace).toBe('yellowDisc');
        expect(sign(limitFrom(12, 70), crossing).signFace).toBe('whiteDisc');
    });

    test("a section outside every country section falls back to the reader's display units", () => {
        const outsideEveryCountry = { ...limit(100), startPointIndex: 50, endPointIndex: 60 };
        const sign = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX, {
            displayUnits: { distance: { type: 'imperial_us' } },
        })(outsideEveryCountry, routeIn('NLD'));

        expect(sign.signFace).toBe('plaque');
        expect(sign.signLabel).toBe('60');
    });

    test('without country sections the display units decide the face and the unit', () => {
        const metric = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX)(limit(100));
        expect([metric.signFace, metric.signLabel]).toEqual(['whiteDisc', '100']);

        const british = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX, {
            displayUnits: { distance: { type: 'imperial_uk' } },
        })(limit(112));
        expect([british.signFace, british.signLabel]).toEqual(['whiteDisc', '70']);
    });

    test('an explicit unit overrides the country and the display units alike', () => {
        const sign = toDisplaySpeedLimitSectionProps(INSTANCE_INDEX, { unit: 'km/h' })(limit(112), routeIn('GBR'));

        // The face stays British — only the unit was overridden.
        expect([sign.signFace, sign.signLabel]).toEqual(['whiteDisc', '112']);
    });

    test('the image id carries the instance suffix, so two modules do not share a face', () => {
        expect(toDisplaySpeedLimitSectionProps(2)(limit(70), routeIn('SWE')).signImageID).toBe(
            'routeSpeedLimitYellowDisc-2',
        );
    });
});
