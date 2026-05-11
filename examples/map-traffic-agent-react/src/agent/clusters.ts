import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { Cluster } from './types';

type ClustersAnalysisData = {
    groups: ReadonlyArray<{
        id: string;
        headline: string;
        body: string;
        memberIds: readonly string[];
        centroid: [number, number];
        size?: number;
        totalDelaySeconds?: number;
        peakDelaySeconds?: number;
        diameterKm?: number;
        primaryRoads?: readonly string[];
    }>;
};

type RawGroup = Partial<ClustersAnalysisData['groups'][number]>;

function normaliseGroup(g: RawGroup, incidents: readonly TrafficIncident[], knownIds: Set<string>): Cluster | null {
    if (typeof g.id !== 'string') return null;
    const memberIds = (g.memberIds ?? []).filter((id) => knownIds.has(id));
    if (memberIds.length === 0) return null;

    let centroid = g.centroid;
    if (!centroid || (centroid[0] === 0 && centroid[1] === 0)) {
        const pts = incidents.filter((f) => memberIds.includes(f.properties.id as string));
        if (pts.length === 0) return null;
        const coords = pts.map((f) =>
            f.geometry.type === 'Point'
                ? (f.geometry.coordinates as [number, number])
                : (f.geometry.coordinates as [number, number][])[0],
        );
        const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
        centroid = [lng, lat];
    }

    return {
        id: g.id,
        headline: typeof g.headline === 'string' ? g.headline : '',
        body: typeof g.body === 'string' ? g.body : '',
        centroid,
        incidentIds: memberIds,
        size: g.size,
        totalDelaySeconds: g.totalDelaySeconds,
        peakDelaySeconds: g.peakDelaySeconds,
        diameterKm: g.diameterKm,
        primaryRoads: g.primaryRoads,
    };
}

/** Materialise UI Clusters from the canonical `{ groups: [...] }` analysis payload. */
export function clustersFromAnalysis(data: unknown, incidents: readonly TrafficIncident[]): Cluster[] {
    if (!data || typeof data !== 'object') return [];
    if (!('groups' in data) || !Array.isArray((data as ClustersAnalysisData).groups)) return [];
    const groups = (data as ClustersAnalysisData).groups as readonly RawGroup[];

    const knownIds = new Set<string>();
    for (const f of incidents) {
        const id = f.properties.id;
        if (typeof id === 'string') knownIds.add(id);
    }
    return groups.map((g) => normaliseGroup(g, incidents, knownIds)).filter((c): c is Cluster => c !== null);
}
