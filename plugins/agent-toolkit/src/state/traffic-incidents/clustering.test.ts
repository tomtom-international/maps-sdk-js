import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { type ClusterResult, classifyTrend, matchPreviousClusters, runClustering } from './clustering';

/**
 * Build a fake TrafficIncident with customisable coordinates, delay, category,
 * and road numbers. Defaults to a Point at [0, 0].
 */
function makeFakeIncident(
    id: string,
    overrides?: {
        coordinates?: [number, number];
        lineCoordinates?: [number, number][];
        delayInSeconds?: number;
        category?: string;
        roadNumbers?: string[];
    },
): TrafficIncident {
    const coords = overrides?.coordinates ?? [0, 0];
    const geometry = overrides?.lineCoordinates
        ? { type: 'LineString' as const, coordinates: overrides.lineCoordinates }
        : { type: 'Point' as const, coordinates: coords };
    return {
        type: 'Feature',
        id,
        geometry,
        properties: {
            id,
            category: overrides?.category ?? 'jam',
            magnitudeOfDelay: 'moderate',
            delayInSeconds: overrides?.delayInSeconds,
            timeValidity: 'present',
            events: [],
            roadNumbers: overrides?.roadNumbers,
        },
    } as unknown as TrafficIncident;
}

describe('runClustering', () => {
    it('clusters nearby incidents into 1 group', () => {
        const incidents = [
            makeFakeIncident('a', { coordinates: [4.9, 52.37], delayInSeconds: 120 }),
            makeFakeIncident('b', { coordinates: [4.901, 52.37], delayInSeconds: 60 }),
            makeFakeIncident('c', { coordinates: [4.902, 52.37], delayInSeconds: 30 }),
            makeFakeIncident('d', { coordinates: [4.903, 52.37], delayInSeconds: 90 }),
            makeFakeIncident('e', { coordinates: [4.904, 52.37], delayInSeconds: 45 }),
        ];
        const result = runClustering(incidents, { minMembers: 3 });
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].memberIds).toHaveLength(5);
        expect(result.groups[0].totalDelaySeconds).toBe(345);
        expect(result.groups[0].peakDelaySeconds).toBe(120);
        expect(result.groups[0].size).toBe(5);
    });

    it('produces 2 groups for distant clusters, sorted by total delay desc', () => {
        const clusterA = [
            makeFakeIncident('a1', { coordinates: [4.9, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('a2', { coordinates: [4.901, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('a3', { coordinates: [4.902, 52.37], delayInSeconds: 100 }),
        ];
        const clusterB = [
            makeFakeIncident('b1', { coordinates: [5.5, 52.0], delayInSeconds: 200 }),
            makeFakeIncident('b2', { coordinates: [5.501, 52.0], delayInSeconds: 200 }),
            makeFakeIncident('b3', { coordinates: [5.502, 52.0], delayInSeconds: 200 }),
        ];
        const result = runClustering([...clusterA, ...clusterB], { minMembers: 3 });
        expect(result.groups).toHaveLength(2);
        expect(result.groups[0].totalDelaySeconds).toBe(600);
        expect(result.groups[1].totalDelaySeconds).toBe(300);
    });

    it('returns empty groups for empty input', () => {
        expect(runClustering([], {})).toEqual({ groups: [] });
    });

    it('returns empty groups when no incidents survive pre-filter', () => {
        const incidents = [
            makeFakeIncident('r1', { category: 'roadworks', delayInSeconds: 0 }),
            makeFakeIncident('r2', { category: 'roadworks', delayInSeconds: 0 }),
            makeFakeIncident('r3', { category: 'roadworks', delayInSeconds: 0 }),
        ];
        expect(runClustering(incidents, { minMembers: 3 }).groups).toEqual([]);
    });

    it('excludes 0-delay roadworks and road-closed by default', () => {
        const incidents = [
            makeFakeIncident('j1', { coordinates: [4.9, 52.37], delayInSeconds: 100, category: 'jam' }),
            makeFakeIncident('j2', { coordinates: [4.901, 52.37], delayInSeconds: 100, category: 'jam' }),
            makeFakeIncident('j3', { coordinates: [4.902, 52.37], delayInSeconds: 100, category: 'jam' }),
            makeFakeIncident('rw1', { coordinates: [4.9, 52.37], delayInSeconds: 0, category: 'roadworks' }),
            makeFakeIncident('rc1', { coordinates: [4.9, 52.37], delayInSeconds: 0, category: 'road-closed' }),
        ];
        const result = runClustering(incidents, { minMembers: 3 });
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].memberIds).not.toContain('rw1');
        expect(result.groups[0].memberIds).not.toContain('rc1');
    });

    it('keeps roadworks that have delay > 0', () => {
        const incidents = [
            makeFakeIncident('rw1', { coordinates: [4.9, 52.37], delayInSeconds: 120, category: 'roadworks' }),
            makeFakeIncident('rw2', { coordinates: [4.901, 52.37], delayInSeconds: 60, category: 'roadworks' }),
            makeFakeIncident('rw3', { coordinates: [4.902, 52.37], delayInSeconds: 30, category: 'roadworks' }),
        ];
        const result = runClustering(incidents, { minMembers: 3 });
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].memberIds).toEqual(expect.arrayContaining(['rw1', 'rw2', 'rw3']));
    });

    it('respects maxClusters (only top N returned)', () => {
        const c1 = [
            makeFakeIncident('a1', { coordinates: [4.9, 52.37], delayInSeconds: 300 }),
            makeFakeIncident('a2', { coordinates: [4.901, 52.37], delayInSeconds: 300 }),
            makeFakeIncident('a3', { coordinates: [4.902, 52.37], delayInSeconds: 300 }),
        ];
        const c2 = [
            makeFakeIncident('b1', { coordinates: [5.5, 52.0], delayInSeconds: 100 }),
            makeFakeIncident('b2', { coordinates: [5.501, 52.0], delayInSeconds: 100 }),
            makeFakeIncident('b3', { coordinates: [5.502, 52.0], delayInSeconds: 100 }),
        ];
        const result = runClustering([...c1, ...c2], { minMembers: 3, maxClusters: 1 });
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].totalDelaySeconds).toBe(900);
    });

    it('reports the most-frequent category as primaryCategory', () => {
        const incidents = [
            makeFakeIncident('a', { coordinates: [4.9, 52.37], delayInSeconds: 100, category: 'jam' }),
            makeFakeIncident('b', { coordinates: [4.901, 52.37], delayInSeconds: 100, category: 'jam' }),
            makeFakeIncident('c', { coordinates: [4.902, 52.37], delayInSeconds: 100, category: 'accident' }),
        ];
        const result = runClustering(incidents, { minMembers: 3 });
        expect(result.groups[0].primaryCategory).toBe('jam');
    });

    it('assigns stable IDs when overlap >= 50% with previous clusters', () => {
        const incidents = [
            makeFakeIncident('a', { coordinates: [4.9, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('b', { coordinates: [4.901, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('c', { coordinates: [4.902, 52.37], delayInSeconds: 100 }),
        ];
        const previous: ClusterResult[] = [makePrev('prev-cluster-1', ['a', 'b', 'c'], [300])];
        const result = runClustering(incidents, { minMembers: 3 }, previous);
        expect(result.groups[0].id).toBe('prev-cluster-1');
    });

    it('generates centroid-based IDs for unmatched clusters', () => {
        const incidents = [
            makeFakeIncident('x', { coordinates: [4.9, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('y', { coordinates: [4.901, 52.37], delayInSeconds: 100 }),
            makeFakeIncident('z', { coordinates: [4.902, 52.37], delayInSeconds: 100 }),
        ];
        const result = runClustering(incidents, { minMembers: 3 });
        // centroid lng/lat plus a member-id disambiguator (lowest member id).
        expect(result.groups[0].id).toMatch(/^cluster-[\d.-]+-[\d.-]+-.+$/);
    });

    it('handles LineString incidents by extracting centroids', () => {
        const incidents = [
            makeFakeIncident('l1', {
                lineCoordinates: [
                    [4.9, 52.37],
                    [4.91, 52.38],
                ],
                delayInSeconds: 60,
            }),
            makeFakeIncident('l2', {
                lineCoordinates: [
                    [4.905, 52.375],
                    [4.915, 52.385],
                ],
                delayInSeconds: 60,
            }),
            makeFakeIncident('l3', {
                lineCoordinates: [
                    [4.902, 52.372],
                    [4.912, 52.382],
                ],
                delayInSeconds: 60,
            }),
        ];
        const result = runClustering(incidents, { minMembers: 3, eps: 2 });
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].memberIds).toEqual(expect.arrayContaining(['l1', 'l2', 'l3']));
    });
});

describe('runClustering — multi-poll trend', () => {
    // Three co-located incidents whose per-incident delay we vary per snapshot.
    const snapshot = (delayEach: number): TrafficIncident[] => [
        makeFakeIncident('a', { coordinates: [4.9, 52.37], delayInSeconds: delayEach }),
        makeFakeIncident('b', { coordinates: [4.901, 52.37], delayInSeconds: delayEach }),
        makeFakeIncident('c', { coordinates: [4.902, 52.37], delayInSeconds: delayEach }),
    ];

    it('first appearance is "new"', () => {
        const r = runClustering(snapshot(100), { minMembers: 3 });
        expect(r.groups[0].trend).toBe('new');
        expect(r.groups[0].delaySamples).toEqual([300]);
    });

    it('is "steady" until the window has 3 samples, then classifies', () => {
        const r1 = runClustering(snapshot(100), { minMembers: 3 });
        const r2 = runClustering(snapshot(200), { minMembers: 3 }, r1.groups);
        // matched but only 2 samples — too few to call a trend
        expect(r2.groups[0].trend).toBe('steady');
        expect(r2.groups[0].delaySamples).toEqual([300, 600]);
        const r3 = runClustering(snapshot(300), { minMembers: 3 }, r2.groups);
        // [300, 600, 900] — two consecutive rises, net well over 10%
        expect(r3.groups[0].trend).toBe('growing');
    });

    it('detects "fading" over three falling snapshots', () => {
        const r1 = runClustering(snapshot(300), { minMembers: 3 });
        const r2 = runClustering(snapshot(200), { minMembers: 3 }, r1.groups);
        const r3 = runClustering(snapshot(100), { minMembers: 3 }, r2.groups);
        expect(r3.groups[0].trend).toBe('fading');
    });

    it('rides out a one-tick blip as "steady"', () => {
        const r1 = runClustering(snapshot(100), { minMembers: 3 });
        const r2 = runClustering(snapshot(300), { minMembers: 3 }, r1.groups); // spike
        const r3 = runClustering(snapshot(100), { minMembers: 3 }, r2.groups); // back down
        // window [300, 900, 300]: up then down — not two consecutive moves
        expect(r3.groups[0].trend).toBe('steady');
    });

    it('bounds the rolling window to the last 3 samples', () => {
        let groups = runClustering(snapshot(100), { minMembers: 3 }).groups;
        for (const d of [200, 300, 400, 500]) {
            groups = runClustering(snapshot(d), { minMembers: 3 }, groups).groups;
        }
        expect(groups[0].delaySamples).toHaveLength(3);
        expect(groups[0].delaySamples).toEqual([900, 1200, 1500]);
    });

    it('stays "new" (not "steady") when re-run at the same moment before the window grows', () => {
        const r1 = runClustering(snapshot(100), { minMembers: 3 }, undefined, 1000);
        expect(r1.groups[0].trend).toBe('new');
        // Same-moment re-cluster (ID-stability re-read): window stays a single
        // sample, so the label must remain "new", not collapse to "steady".
        const reRun = runClustering(snapshot(100), { minMembers: 3 }, r1.groups, 1000, 1000);
        expect(reRun.groups[0].delaySamples).toEqual([300]);
        expect(reRun.groups[0].trend).toBe('new');
    });

    it('overwrites (not appends) the latest sample when re-run at the same moment', () => {
        // Real tick at t=1000, then t=2000 → window grows to two genuine samples.
        const r1 = runClustering(snapshot(100), { minMembers: 3 }, undefined, 1000);
        const r2 = runClustering(snapshot(200), { minMembers: 3 }, r1.groups, 2000, 1000);
        expect(r2.groups[0].delaySamples).toEqual([300, 600]);

        // Re-cluster the SAME t=2000 snapshot (ID-stability re-read): the window
        // must not gain a duplicate sample — the last one is overwritten in place.
        const reRun = runClustering(snapshot(200), { minMembers: 3 }, r2.groups, 2000, 2000);
        expect(reRun.groups[0].delaySamples).toEqual([300, 600]);

        // A genuinely new moment then appends as normal.
        const r3 = runClustering(snapshot(300), { minMembers: 3 }, reRun.groups, 3000, 2000);
        expect(r3.groups[0].delaySamples).toEqual([300, 600, 900]);
        expect(r3.groups[0].trend).toBe('growing');
    });
});

describe('classifyTrend', () => {
    it('returns "steady" with fewer than 3 samples', () => {
        expect(classifyTrend([300])).toBe('steady');
        expect(classifyTrend([300, 600])).toBe('steady');
    });

    it('returns "growing" on two consecutive rises past the net threshold', () => {
        expect(classifyTrend([100, 110, 121])).toBe('growing');
    });

    it('returns "fading" on two consecutive falls past the net threshold', () => {
        expect(classifyTrend([900, 600, 300])).toBe('fading');
    });

    it('returns "steady" when net change is within the threshold', () => {
        expect(classifyTrend([100, 100, 105])).toBe('steady');
    });

    it('returns "steady" on a non-monotonic blip', () => {
        expect(classifyTrend([300, 900, 300])).toBe('steady');
    });
});

describe('matchPreviousClusters', () => {
    it('matches clusters with >= 50% Jaccard overlap', () => {
        const fresh = [{ memberIds: ['a', 'b', 'c', 'd'] }];
        const prev = [{ id: 'old-1', memberIds: ['a', 'b', 'c'] }];
        expect(matchPreviousClusters(fresh, prev).get(0)).toBe('old-1');
    });

    it('does not match clusters with < 50% overlap', () => {
        const fresh = [{ memberIds: ['a', 'b', 'c', 'd', 'e', 'f'] }];
        const prev = [{ id: 'old-1', memberIds: ['a', 'x', 'y', 'z'] }];
        expect(matchPreviousClusters(fresh, prev).has(0)).toBe(false);
    });

    it('performs greedy 1:1 assignment (best overlap first)', () => {
        const fresh = [{ memberIds: ['a', 'b', 'c'] }, { memberIds: ['x', 'y', 'z'] }];
        const prev = [
            { id: 'old-A', memberIds: ['a', 'b', 'c'] },
            { id: 'old-B', memberIds: ['x', 'y', 'z'] },
        ];
        const mapping = matchPreviousClusters(fresh, prev);
        expect(mapping.get(0)).toBe('old-A');
        expect(mapping.get(1)).toBe('old-B');
    });
});

/** Minimal previous-cluster stand-in for ID-stability / trend-continuity tests. */
function makePrev(id: string, memberIds: string[], delaySamples: number[]): ClusterResult {
    return {
        id,
        centroid: [4.901, 52.37],
        memberIds,
        size: memberIds.length,
        totalDelaySeconds: delaySamples[delaySamples.length - 1] ?? 0,
        peakDelaySeconds: 100,
        diameterKm: 0.1,
        primaryRoads: [],
        primaryCategory: 'jam',
        trend: 'new',
        delaySamples,
    };
}
