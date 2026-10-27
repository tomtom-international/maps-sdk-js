import type { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { monitoredRoutes } from '../monitoredRoutes';

type Routing = Parameters<typeof monitoredRoutes>[0];
type Entry = Routing['entries'][number];

const routes = (delays: number[]): Routes =>
    ({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [] },
                properties: {
                    index: 0,
                    summary: {
                        travelTimeInSeconds: 600,
                        lengthInMeters: 5000,
                        arrivalTime: '2026-10-22T10:00:00Z',
                    },
                    sections: { traffic: delays.map((delayInSeconds) => ({ delayInSeconds })) },
                },
            },
        ],
    }) as unknown as Routes;

const entry = (id: string, data: Routes = routes([])): Entry =>
    ({ id, label: `Route ${id}`, timestamp: 1, data }) as unknown as Entry;

const routing = (entries: Entry[], monitoredIds: string[]): Routing => ({
    entries,
    isMonitored: (entryId) => monitoredIds.includes(entryId),
});

describe('monitoredRoutes', () => {
    it('lists only the entries whose monitor runs', () => {
        const result = monitoredRoutes(routing([entry('routes-0'), entry('routes-1')], ['routes-1']));
        expect(result.map((route) => route.entryId)).toEqual(['routes-1']);
    });

    it('leaves out an entry that reuses a monitored id after a reset', () => {
        // After `reset()` stopped the monitor of `routes-0`, a plain route takes the same id again.
        expect(monitoredRoutes(routing([entry('routes-0')], []))).toEqual([]);
    });

    it('sums the on-route traffic delays of each alternative', () => {
        const [route] = monitoredRoutes(routing([entry('routes-0', routes([60, 120]))], ['routes-0']));
        expect(route.alternatives).toEqual([
            {
                index: 0,
                travelTimeInSeconds: 600,
                trafficDelayInSeconds: 180,
                lengthInMeters: 5000,
                arrivalTime: Date.parse('2026-10-22T10:00:00Z'),
            },
        ]);
    });
});
