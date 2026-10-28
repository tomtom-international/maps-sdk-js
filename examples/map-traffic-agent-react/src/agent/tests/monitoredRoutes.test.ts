import type { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { monitoredRoutes } from '../monitoredRoutes';

type Routing = Parameters<typeof monitoredRoutes>[0];
type Dataset = Routing['datasets'][number];

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

const dataset = (id: string, data: Routes = routes([])): Dataset =>
    ({ id, label: `Route ${id}`, timestamp: 1, data }) as unknown as Dataset;

const routing = (datasets: Dataset[], monitoredIds: string[]): Routing => ({
    datasets,
    isMonitored: (datasetId) => monitoredIds.includes(datasetId),
});

describe('monitoredRoutes', () => {
    it('lists only the datasets whose monitor runs', () => {
        const result = monitoredRoutes(routing([dataset('routes-0'), dataset('routes-1')], ['routes-1']));
        expect(result.map((route) => route.datasetId)).toEqual(['routes-1']);
    });

    it('leaves out a dataset that reuses a monitored id after a reset', () => {
        // After `reset()` stopped the monitor of `routes-0`, a plain route takes the same id again.
        expect(monitoredRoutes(routing([dataset('routes-0')], []))).toEqual([]);
    });

    it('sums the on-route traffic delays of each alternative', () => {
        const [route] = monitoredRoutes(routing([dataset('routes-0', routes([60, 120]))], ['routes-0']));
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
