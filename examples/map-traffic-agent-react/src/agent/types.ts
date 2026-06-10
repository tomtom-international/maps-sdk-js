export type ClusterTrend = 'growing' | 'fading' | 'steady' | 'new' | 'unknown';

/** Cluster as rendered by the persona UI — built from the `clusters` analysis `data.groups`. */
export type Cluster = {
    id: string;
    headline: string;
    centroid: [number, number];
    incidentIds: readonly string[];
    /** Optional evidence the agent computed; UI shows what's present. */
    size?: number;
    totalDelaySeconds?: number;
    peakDelaySeconds?: number;
    diameterKm?: number;
    primaryRoads?: readonly string[];
    primaryCategory?: string;
    trend?: ClusterTrend;
};
