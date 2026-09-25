import type { Place } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { summarizePlace } from './summarize';

const makePlace = (extraProps: Record<string, unknown> = {}): Place =>
    ({
        type: 'Feature',
        id: 'p1',
        geometry: { type: 'Point', coordinates: [4.9, 52.4] },
        properties: {
            type: 'POI',
            address: { freeformAddress: 'Dam, Amsterdam' },
            poi: { name: 'Test POI' },
            ...extraProps,
        },
    }) as Place;

describe('summarizePlace — field projection', () => {
    test('projects a fixed field set, ignoring extra source properties', () => {
        const place = makePlace({
            areaId: '20567430',
            areaCountry: 'NL',
            areaTags: ['walkable', 'transit_connected'],
        });
        const summary = summarizePlace(place);
        expect(Object.keys(summary).sort((a, b) => a.localeCompare(b))).toEqual([
            'address',
            'id',
            'name',
            'position',
            'type',
        ]);
    });
});

describe('summarizePlace — type passthrough', () => {
    test('surfaces properties.type so the model can classify the place', () => {
        const summary = summarizePlace(makePlace({ type: 'Cross Street' }));
        expect(summary.type).toBe('Cross Street');
    });

    test('type is undefined when the source place carries none', () => {
        const place = {
            type: 'Feature',
            id: 'p1',
            geometry: { type: 'Point', coordinates: [4.9, 52.4] },
            properties: { poi: { name: 'Test POI' } },
        } as Place;
        expect(summarizePlace(place).type).toBeUndefined();
    });
});
