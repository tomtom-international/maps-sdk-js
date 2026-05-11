/** Cluster as rendered by the persona UI — parsed from `_analyses.getResult('clusters').data.groups`. */
export type Cluster = {
    id: string;
    headline: string;
    body: string;
    centroid: [number, number];
    incidentIds: readonly string[];
    /** Optional evidence the agent computed; UI shows what's present. */
    size?: number;
    totalDelaySeconds?: number;
    peakDelaySeconds?: number;
    diameterKm?: number;
    primaryRoads?: readonly string[];
};
