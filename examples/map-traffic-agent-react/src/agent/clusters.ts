import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { Cluster, ClusterTrend } from './types';

/**
 * Structured cluster payload as stored by the clustering analysis spec
 * (`runClustering` output). Display strings are composed here in the UI, not
 * carried on the payload.
 */
type ClustersAnalysisData = {
    groups: ReadonlyArray<{
        id: string;
        memberIds: readonly string[];
        centroid: [number, number];
        size?: number;
        totalDelaySeconds?: number;
        peakDelaySeconds?: number;
        diameterKm?: number;
        primaryRoads?: readonly string[];
        primaryCategory?: string;
        trend?: ClusterTrend;
    }>;
};

type RawGroup = Partial<ClustersAnalysisData['groups'][number]>;

const TRENDS: ReadonlySet<ClusterTrend> = new Set(['growing', 'fading', 'steady', 'new', 'unknown']);

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

/** Headline for a cluster: top roads when present, else its category. */
export function clusterHeadline(g: { primaryRoads?: readonly string[]; primaryCategory?: string }): string {
    if (g.primaryRoads && g.primaryRoads.length > 0) {
        return `${g.primaryRoads.slice(0, 2).join(' / ')} area`;
    }
    const cat = g.primaryCategory ?? 'incident';
    return `${cat.charAt(0).toUpperCase()}${cat.slice(1)} cluster`;
}

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
        headline: clusterHeadline(g),
        centroid,
        incidentIds: memberIds,
        size: g.size,
        totalDelaySeconds: g.totalDelaySeconds,
        peakDelaySeconds: g.peakDelaySeconds,
        diameterKm: g.diameterKm,
        primaryRoads: g.primaryRoads,
        primaryCategory: g.primaryCategory,
        trend: g.trend && TRENDS.has(g.trend) ? g.trend : 'unknown',
    };
}
