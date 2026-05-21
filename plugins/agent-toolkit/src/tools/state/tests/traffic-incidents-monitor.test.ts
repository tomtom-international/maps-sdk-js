import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState, TrafficIncidentsState, TrafficTilesState } from '../../../state';
import { executeStartTrafficIncidentsMonitor } from '../start-traffic-incidents-monitor';
import { executeStopTrafficIncidentsMonitor } from '../stop-traffic-incidents-monitor';

vi.mock('@tomtom-org/maps-sdk/services', () => ({
    trafficIncidentDetails: vi.fn(),
    trafficAreaAnalytics: vi.fn().mockResolvedValue(null),
}));

import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

const mockFetch = trafficIncidentDetails as ReturnType<typeof vi.fn>;

const feat = (id: string, props: Partial<TrafficIncident['properties']> = {}): TrafficIncident => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
        id,
        category: 'jam',
        magnitudeOfDelay: 'moderate',
        timeValidity: 'present',
        events: [],
        ...props,
    } as TrafficIncident['properties'],
});

const makeState = () => {
    const trafficIncidents = new TrafficIncidentsState({
        mapLibreMap: { getSource: () => undefined, getLayer: () => undefined },
    } as any);
    return {
        trafficTiles: new TrafficTilesState({} as any),
        trafficAreaAnalytics: new TrafficAreaAnalyticsState({} as any),
        trafficIncidents,
    } as any;
};

const seedEntry = (state: any, opts: Partial<{ filters: any; bbox: any; label: string }> = {}): Promise<string> =>
    state.trafficIncidents.addIncidentsEntry(
        [feat('seed-1')],
        { bbox: opts.bbox ?? [0, 0, 1, 1], ...opts.filters },
        opts.label ?? 'seed',
        Date.now(),
    );

describe('executeStartTrafficIncidentsMonitor', () => {
    let entryIdsToStop: { state: any; id: string }[] = [];

    beforeEach(() => {
        mockFetch.mockReset();
        entryIdsToStop = [];
    });

    afterEach(() => {
        // Stop any monitor we spun up so the underlying setInterval doesn't leak across tests.
        for (const { state, id } of entryIdsToStop) state.trafficIncidents.stopMonitoring(id);
    });

    it('errors when the entry does not exist', async () => {
        const state = makeState();
        const result = await executeStartTrafficIncidentsMonitor({ incidentsEntryID: 'missing' }, state);
        expect('error' in result).toBe(true);
        if ('error' in result) expect(result.error).toContain('missing');
    });

    it('starts polling and is idempotent on a second call', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });

        const first = await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id, intervalMs: 30_000 }, state);
        expect(first).toMatchObject({ incidentsEntryID: id, alreadyRunning: false });
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);

        const second = await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        expect(second).toMatchObject({ incidentsEntryID: id, alreadyRunning: true });
    });

    it('forwards the entry filters to the polling fetcher (eager tick uses entry.filters)', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state, {
            filters: { categoryFilter: ['jam'], timeValidityFilter: ['present'] },
        });
        entryIdsToStop.push({ state, id });

        await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id }, state);

        // Wait one microtask for the eager tick promise chain to flush.
        await Promise.resolve();
        await Promise.resolve();

        expect(mockFetch).toHaveBeenCalledWith({
            bbox: [0, 0, 1, 1],
            categoryFilter: ['jam'],
            timeValidityFilter: ['present'],
        });
    });

    it('reports alreadyRunning: false after the previous run errored, and re-arms the timer (regression)', async () => {
        // Regression: `isMonitored` used to track "any non-idle status", so a monitor
        // sitting in `stopped-error` made the next `start` call report `alreadyRunning: true`
        // even though `IncidentMonitor.start` actually does restart from `stopped-error`.
        // The agent would then trust an unchanged interval and a recovered fetcher would
        // be silently dropped.
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });
        const monitor = state.trafficIncidents.entries.find((e: any) => e.id === id);
        // Drive the monitor's status into `stopped-error` directly — the public API
        // only flips into that state through a failing fetch tick, which races real timers.
        const created = (state.trafficIncidents as any)._createMonitorForEntry(monitor);
        monitor._monitor = created;
        (created as any)._status = 'stopped-error';
        (created as any)._error = 'boom';
        expect(state.trafficIncidents.isMonitored(id)).toBe(false);

        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const result = await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, alreadyRunning: false });
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);
    });

    it('does not echo the requested intervalMs back — second call cannot be relied on to apply it', async () => {
        // The output deliberately omits intervalMs because IncidentMonitor.start no-ops when
        // already running; reporting the requested value back would mislead the agent into
        // thinking a new interval took effect on the second call.
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });

        const result = (await executeStartTrafficIncidentsMonitor(
            { incidentsEntryID: id, intervalMs: 30_000 },
            state,
        )) as Record<string, unknown>;
        expect(result.intervalMs).toBeUndefined();
    });
});

describe('executeStopTrafficIncidentsMonitor', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('errors when the entry does not exist', async () => {
        const state = makeState();
        const result = await executeStopTrafficIncidentsMonitor({ incidentsEntryID: 'missing' }, state);
        expect('error' in result).toBe(true);
    });

    it('reports wasRunning: false when no monitor was active', async () => {
        const state = makeState();
        const id = await seedEntry(state);
        const result = await executeStopTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, wasRunning: false });
    });

    it('stops a running monitor and reports wasRunning: true', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);

        await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);

        const result = await executeStopTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, wasRunning: true });
        expect(state.trafficIncidents.isMonitored(id)).toBe(false);
    });

    it('leaves the entry intact — only the polling stops', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);

        await executeStartTrafficIncidentsMonitor({ incidentsEntryID: id }, state);
        await executeStopTrafficIncidentsMonitor({ incidentsEntryID: id }, state);

        expect(state.trafficIncidents.entries.find((e: any) => e.id === id)).toBeDefined();
    });
});
