import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { FALLBACK_INCIDENT_PALETTE, readIncidentPalette } from '../readIncidentPalette';

// Layer IDs duplicated from the util so a rename is caught by these tests.
const CANONICAL_LAYERS = [
    { id: 'TrafficIncidents - No delay outline', 'line-color': '#aaaaaa' },
    { id: 'TrafficIncidents - No delay pattern', 'line-color': '#bbbbbb' },
    { id: 'TrafficIncidents - Minor jam outline', 'line-color': '#111111' },
    { id: 'TrafficIncidents - Minor jam', 'line-color': '#222222' },
    { id: 'TrafficIncidents - Moderate jam outline', 'line-color': '#333333' },
    { id: 'TrafficIncidents - Moderate jam', 'line-color': '#444444' },
    { id: 'TrafficIncidents - Major jam outline', 'line-color': '#555555' },
    { id: 'TrafficIncidents - Major jam', 'line-color': '#666666' },
    { id: 'TrafficIncidents - Closed road outline', 'line-color': '#777777' },
    { id: 'TrafficIncidents - Closed road pattern', 'line-color': '#888888' },
];

const makeMap = (layers: Array<{ id: string; 'line-color'?: unknown; paint?: unknown }>) =>
    ({
        getStyle: () => ({
            layers: layers.map((l) =>
                'paint' in l ? { id: l.id, paint: l.paint } : { id: l.id, paint: { 'line-color': l['line-color'] } },
            ),
        }),
    }) as unknown as Pick<MapLibreMap, 'getStyle'>;

describe('readIncidentPalette', () => {
    test('returns fallback palette when the style has no traffic layers', () => {
        const map = makeMap([]);
        expect(readIncidentPalette(map)).toEqual(FALLBACK_INCIDENT_PALETTE);
    });

    test('returns fallback palette when getStyle returns no layers array', () => {
        const map = { getStyle: () => ({}) } as unknown as Pick<MapLibreMap, 'getStyle'>;
        expect(readIncidentPalette(map)).toEqual(FALLBACK_INCIDENT_PALETTE);
    });

    test('extracts every canonical colour when all layers are present with literal line-color', () => {
        const map = makeMap(CANONICAL_LAYERS);
        const palette = readIncidentPalette(map);
        expect(palette).toEqual({
            outline: {
                unknown: '#aaaaaa',
                minor: '#111111',
                moderate: '#333333',
                major: '#555555',
                indefinite: '#777777',
            },
            inner: {
                unknown: '#bbbbbb',
                minor: '#222222',
                moderate: '#444444',
                major: '#666666',
                indefinite: '#888888',
            },
        });
    });

    test('falls back per-magnitude when only some layers are present', () => {
        // Only supply the `major` pair — everything else should remain the fallback.
        const map = makeMap([
            { id: 'TrafficIncidents - Major jam outline', 'line-color': '#aa0000' },
            { id: 'TrafficIncidents - Major jam', 'line-color': '#bb0000' },
        ]);
        const palette = readIncidentPalette(map);
        expect(palette.outline.major).toBe('#aa0000');
        expect(palette.inner.major).toBe('#bb0000');
        expect(palette.outline.minor).toBe(FALLBACK_INCIDENT_PALETTE.outline.minor);
        expect(palette.inner.minor).toBe(FALLBACK_INCIDENT_PALETTE.inner.minor);
        expect(palette.outline.unknown).toBe(FALLBACK_INCIDENT_PALETTE.outline.unknown);
    });

    test('does not warn when layers are simply missing (common for non-TomTom styles)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            readIncidentPalette(makeMap([]));
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    test('falls back and warns once when a layer has a non-literal line-color expression', () => {
        // Author replaced the literal with a match expression — we can't evaluate it safely.
        const map = makeMap([
            {
                id: 'TrafficIncidents - Major jam',
                paint: { 'line-color': ['match', ['get', 'foo'], 'a', '#111', '#222'] },
            },
        ]);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const palette = readIncidentPalette(map);
            expect(palette.inner.major).toBe(FALLBACK_INCIDENT_PALETTE.inner.major);
            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('TrafficIncidents - Major jam');
        } finally {
            warn.mockRestore();
        }
    });

    test('groups all non-literal layers into a single warning', () => {
        const map = makeMap([
            {
                id: 'TrafficIncidents - Major jam',
                paint: { 'line-color': ['match', ['get', 'x'], '#1', '#2'] },
            },
            {
                id: 'TrafficIncidents - Minor jam outline',
                paint: { 'line-color': ['case', ['==', ['get', 'x'], 1], '#3', '#4'] },
            },
        ]);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            readIncidentPalette(map);
            expect(warn).toHaveBeenCalledTimes(1);
            const msg = warn.mock.calls[0][0] as string;
            expect(msg).toContain('TrafficIncidents - Major jam');
            expect(msg).toContain('TrafficIncidents - Minor jam outline');
        } finally {
            warn.mockRestore();
        }
    });

    test('ignores non-line layers that happen to share an id collision (defensive)', () => {
        // A layer without `paint` shouldn't throw or pollute the fallback.
        const map = { getStyle: () => ({ layers: [{ id: 'TrafficIncidents - Major jam' }] }) } as unknown as Pick<
            MapLibreMap,
            'getStyle'
        >;
        const palette = readIncidentPalette(map);
        expect(palette.inner.major).toBe(FALLBACK_INCIDENT_PALETTE.inner.major);
    });
});
