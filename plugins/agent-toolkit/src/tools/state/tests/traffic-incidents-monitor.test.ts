import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState, TrafficIncidentsState, TrafficTilesState } from '../../../state';
import { executeSetTrafficIncidentsMonitor } from '../set-traffic-incidents-monitor';

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

const seedEntry = async (
    state: any,
    opts: Partial<{ filters: any; bbox: any; label: string; show: boolean }> = {},
): Promise<string> => {
    const id = await state.trafficIncidents.addIncidentsEntry(
        [feat('seed-1')],
        { bbox: opts.bbox ?? [0, 0, 1, 1], ...opts.filters },
        opts.label ?? 'seed',
        Date.now(),
    );
    // The monitor guard requires a displayed entry. Mark it shown directly — mirrors what
    // showEntry sets, without spinning up the real overlay module against the mock map.
    // Pass `show: false` to leave it hidden (for the guard-rejection test).
    if (opts.show !== false) {
        const entry = state.trafficIncidents.entries.find((e: any) => e.id === id);
        if (entry) entry._shown = true;
    }
    return id;
};

describe('executeSetTrafficIncidentsMonitor — enable', () => {
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
        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: 'missing', enabled: true }, state);
        expect('error' in result).toBe(true);
        if ('error' in result) expect(result.error).toContain('missing');
    });

    it('rejects monitoring a hidden (show:false / never-shown) entry', async () => {
        const state = makeState();
        const id = await seedEntry(state, { show: false });
        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);
        expect('error' in result).toBe(true);
        if ('error' in result) expect(result.error).toContain("isn't displayed");
        expect(state.trafficIncidents.isMonitored(id)).toBe(false);
    });

    it('starts polling and is idempotent on a second enable', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });

        const first = await executeSetTrafficIncidentsMonitor(
            { incidentsEntryID: id, enabled: true, intervalMs: 30_000 },
            state,
        );
        expect(first).toMatchObject({ incidentsEntryID: id, enabled: true, alreadyInState: false });
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);

        const second = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);
        expect(second).toMatchObject({ incidentsEntryID: id, enabled: true, alreadyInState: true });
    });

    it('forwards the entry filters to the polling fetcher (eager tick uses entry.filters)', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state, {
            filters: { categoryFilter: ['jam'], timeValidityFilter: ['present'] },
        });
        entryIdsToStop.push({ state, id });

        await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);

        // Wait one microtask for the eager tick promise chain to flush.
        await Promise.resolve();
        await Promise.resolve();

        expect(mockFetch).toHaveBeenCalledWith({
            bbox: [0, 0, 1, 1],
            categoryFilter: ['jam'],
            timeValidityFilter: ['present'],
        });
    });

    it('reports alreadyInState: false after the previous run errored, and re-arms the timer (regression)', async () => {
        // Regression: `isMonitored` used to track "any non-idle status", so a monitor
        // sitting in `stopped-error` made the next enable report `alreadyInState: true`
        // even though `IncidentMonitor.start` actually does restart from `stopped-error`.
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });
        const monitor = state.trafficIncidents.entries.find((e: any) => e.id === id);
        const created = (state.trafficIncidents as any)._createMonitorForEntry(monitor);
        monitor._monitor = created;
        (created as any)._status = 'stopped-error';
        (created as any)._error = 'boom';
        expect(state.trafficIncidents.isMonitored(id)).toBe(false);

        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, enabled: true, alreadyInState: false });
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);
    });

    it('does not echo the requested intervalMs back — a running monitor cannot be relied on to apply it', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);
        entryIdsToStop.push({ state, id });

        const result = (await executeSetTrafficIncidentsMonitor(
            { incidentsEntryID: id, enabled: true, intervalMs: 30_000 },
            state,
        )) as Record<string, unknown>;
        expect(result.intervalMs).toBeUndefined();
    });
});

describe('executeSetTrafficIncidentsMonitor — disable', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('errors when the entry does not exist', async () => {
        const state = makeState();
        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: 'missing', enabled: false }, state);
        expect('error' in result).toBe(true);
    });

    it('reports alreadyInState: true when no monitor was active', async () => {
        const state = makeState();
        const id = await seedEntry(state);
        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: false }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, enabled: false, alreadyInState: true });
    });

    it('stops a running monitor and reports alreadyInState: false', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);

        await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);
        expect(state.trafficIncidents.isMonitored(id)).toBe(true);

        const result = await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: false }, state);
        expect(result).toMatchObject({ incidentsEntryID: id, enabled: false, alreadyInState: false });
        expect(state.trafficIncidents.isMonitored(id)).toBe(false);
    });

    it('leaves the entry intact — only the polling stops', async () => {
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat('a')] });
        const state = makeState();
        const id = await seedEntry(state);

        await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: true }, state);
        await executeSetTrafficIncidentsMonitor({ incidentsEntryID: id, enabled: false }, state);

        expect(state.trafficIncidents.entries.find((e: any) => e.id === id)).toBeDefined();
    });
});
