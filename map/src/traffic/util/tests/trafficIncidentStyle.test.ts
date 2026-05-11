import type { TrafficIncidentCategory } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { INDEFINITE_DELAY_DASH_COLOR, UNKNOWN_DELAY_DASH_COLOR } from '../../../routing/layers/shared';
import { incidentIconID, severityDashedFilter, severityLineDashColor } from '../trafficIncidentStyle';

describe('incidentIconID', () => {
    test.each<[TrafficIncidentCategory, string]>([
        ['accident', 'traffic-incidents-accident'],
        ['roadworks', 'traffic-incidents-roadworks'],
        ['road-closed', 'traffic-incidents-road_closed'],
        ['lane-closed', 'traffic-incidents-lane_closed'],
        ['narrow-lanes', 'traffic-incidents-lane_closed'],
        ['danger', 'traffic-incidents-danger'],
        ['animals-on-road', 'traffic-incidents-danger'],
        ['broken-down-vehicle', 'traffic-incidents-broken_down_vehicle'],
        ['wind', 'traffic-incidents-wind'],
        ['fog', 'traffic-incidents-fog'],
        ['rain', 'traffic-incidents-rain'],
        ['frost', 'traffic-incidents-frost'],
        ['flooding', 'traffic-incidents-flooding'],
    ])('maps %s to %s', (category, expected) => {
        expect(incidentIconID(category)).toBe(expected);
    });

    test.each<TrafficIncidentCategory>(['jam', 'other'])('returns null for %s', (category) => {
        expect(incidentIconID(category)).toBeNull();
    });
});

describe('severityDashedFilter', () => {
    test('selects incidents with unknown or indefinite magnitudeOfDelay', () => {
        expect(severityDashedFilter).toEqual([
            'in',
            ['get', 'magnitudeOfDelay'],
            ['literal', ['unknown', 'indefinite']],
        ]);
    });
});

describe('severityLineDashColor', () => {
    test('renders unknown in red and indefinite in gray', () => {
        expect(severityLineDashColor).toEqual([
            'match',
            ['get', 'magnitudeOfDelay'],
            'unknown',
            UNKNOWN_DELAY_DASH_COLOR,
            INDEFINITE_DELAY_DASH_COLOR,
        ]);
    });
});
