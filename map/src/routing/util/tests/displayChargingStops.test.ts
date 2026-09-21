import type { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import type { DisplayRouteProps } from '../../types/displayRoutes';
import { toDisplayChargingStops } from '../displayChargingStops';

// The whole time at a charging stop is what the pin shows, so these build the two shapes that can
// differ: a stop that only charges, and one that charges and waits.
const buildRoutes = (chargingTimeInSeconds: number, stopTimeInSeconds?: number): Routes<DisplayRouteProps> =>
    ({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [] },
                properties: {
                    routeState: 'selected',
                    sections: {
                        leg: [
                            {
                                summary: {
                                    stopTimeInSeconds,
                                    chargingInformationAtEndOfLeg: {
                                        type: 'Feature',
                                        geometry: { type: 'Point', coordinates: [1, 2] },
                                        properties: {
                                            chargingParkId: 'park-1',
                                            chargingParkName: 'Park One',
                                            chargingTimeInSeconds,
                                            chargingConnectionInfo: { chargingPowerInkW: 150 },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    }) as unknown as Routes<DisplayRouteProps>;

describe('charging stop display props', () => {
    test('the pin carries the whole time at the stop, not only the charging', () => {
        // 30 minutes there, 20 of them charging — the pin should say 30.
        const stops = toDisplayChargingStops(buildRoutes(20 * 60, 30 * 60), undefined);

        expect(stops.features[0].properties.stopDuration).toBe('30 min');
        // Still available for a label that wants only the charging part.
        expect(stops.features[0].properties.chargingDuration).toBe('20 min');
    });

    test('with nothing else at the stop, the time there is the charging time', () => {
        const stops = toDisplayChargingStops(buildRoutes(20 * 60, 20 * 60), undefined);

        expect(stops.features[0].properties.stopDuration).toBe('20 min');
    });

    test('a leg without a reported stop time falls back to the charging time', () => {
        const stops = toDisplayChargingStops(buildRoutes(20 * 60), undefined);

        expect(stops.features[0].properties.stopDuration).toBe('20 min');
    });

    test('the stop duration follows the configured time display units', () => {
        const stops = toDisplayChargingStops(buildRoutes(20 * 60, 90 * 60), {
            displayUnits: { time: { hours: 'uur', minutes: 'minuten' } },
        });

        expect(stops.features[0].properties.stopDuration).toBe('1 uur 30 minuten');
    });
});
