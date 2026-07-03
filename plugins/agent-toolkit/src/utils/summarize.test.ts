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

describe('summarizePlace — flag-aware area metadata', () => {
    test('default flags: areaId / areaCountry / areaTags omitted even when present on the source', () => {
        const place = makePlace({
            areaId: '20567430',
            areaCountry: 'NL',
            areaTags: ['walkable', 'transit_connected'],
        });
        const summary = summarizePlace(place);
        expect(summary).not.toHaveProperty('areaId');
        expect(summary).not.toHaveProperty('areaCountry');
        expect(summary).not.toHaveProperty('areaTags');
    });

    test('experimentalSearch: true — area metadata copied through when present', () => {
        const place = makePlace({
            areaId: '20567430',
            areaCountry: 'NL',
            areaTags: ['walkable', 'transit_connected'],
        });
        const summary = summarizePlace(place, { experimentalSearch: true });
        expect(summary.areaId).toBe('20567430');
        expect(summary.areaCountry).toBe('NL');
        expect(summary.areaTags).toEqual(['walkable', 'transit_connected']);
    });

    test('experimentalSearch: true — fields stay omitted when absent on the source', () => {
        const summary = summarizePlace(makePlace(), { experimentalSearch: true });
        expect(summary).not.toHaveProperty('areaId');
        expect(summary).not.toHaveProperty('areaCountry');
        expect(summary).not.toHaveProperty('areaTags');
    });

    test('empty areaTags array is treated as absent', () => {
        const place = makePlace({ areaTags: [] });
        const summary = summarizePlace(place, { experimentalSearch: true });
        expect(summary).not.toHaveProperty('areaTags');
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
