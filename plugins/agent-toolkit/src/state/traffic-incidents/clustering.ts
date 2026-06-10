/**
 * Pure DBSCAN clustering logic for traffic incidents.
 *
 * Takes a set of {@link TrafficIncident} features, clusters them spatially
 * using `turf.clustersDbscan`, and returns ranked {@link ClusterResult}
 * groups with stable IDs and multi-poll trend detection. Structured-only —
 * consumers compose any display prose from these fields.
 *
 * No tool-layer or state-layer concerns — just the algorithm.
 *
 * @module agent-toolkit-state
 */

import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import type { Feature, Point } from 'geojson';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Direction a cluster's total delay is trending across recent snapshots. */
export type ClusterTrend = 'growing' | 'fading' | 'steady' | 'new';

/** Tuneable parameters for {@link runClustering}. All optional with sensible defaults. */
export type ClusteringParams = {
    /** DBSCAN neighbourhood radius in km. Default: 0.5 */
    eps?: number;
    /** Minimum members to form a cluster. Default: 3 */
    minMembers?: number;
    /** Maximum clusters to return (top-N by total delay). Default: 6 */
    maxClusters?: number;
    /** Pre-filter rules applied before clustering. */
    preFilter?: {
        /** Categories to exclude entirely. Default: `['roadworks', 'road-closed']` */
        excludeCategories?: string[];
        /** Incidents with `delayInSeconds` below this are excluded (within excludeCategories). Default: 1 (i.e. exclude 0-delay) */
        minDelaySeconds?: number;
    };
};

/** A single cluster produced by {@link runClustering}. */
export type ClusterResult = {
    /** Stable identifier — reused across runs when member overlap >= 50%. */
    id: string;
    /** Geographic centre of the cluster `[lng, lat]`. */
    centroid: [number, number];
    /** Incident IDs belonging to this cluster. */
    memberIds: string[];
    /** Number of member incidents. */
    size: number;
    /** Sum of `delayInSeconds` across all members. */
    totalDelaySeconds: number;
    /** Maximum `delayInSeconds` among all members. */
    peakDelaySeconds: number;
    /** Diagonal of the cluster's bounding box in km. */
    diameterKm: number;
    /** Most-frequently referenced road numbers across members. */
    primaryRoads: string[];
    /** Most-frequent incident category across members (e.g. "jam"). */
    primaryCategory: string;
    /** Trend across recent snapshots — see {@link classifyTrend}. */
    trend: ClusterTrend;
    /**
     * Rolling window of `totalDelaySeconds` across recent matched snapshots
     * (bounded to {@link TREND_WINDOW}). Internal trend state threaded forward
     * via the previous run; not display data.
     */
    delaySamples: number[];
};

/** Output of {@link runClustering}. */
export type ClusteringOutput = { groups: ClusterResult[] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_EPS = 0.5;
const DEFAULT_MIN_MEMBERS = 3;
const DEFAULT_MAX_CLUSTERS = 6;
const DEFAULT_EXCLUDE_CATEGORIES = ['roadworks', 'road-closed'];
const DEFAULT_MIN_DELAY_SECONDS = 1;
const OVERLAP_THRESHOLD = 0.5;
/** Snapshots retained in a cluster's trend window — what {@link classifyTrend} reads. */
const TREND_WINDOW = 3;
/** Net change over the window required to call a trend, not call it noise. */
const TREND_NET_THRESHOLD = 0.1;

/**
 * Pre-filter incidents: exclude those matching `excludeCategories` whose
 * delay is below `minDelaySeconds`. When `minDelaySeconds` is 0, delay
 * filtering is skipped entirely.
 */
function preFilter(
    incidents: TrafficIncident[],
    excludeCategories: string[],
    minDelaySeconds: number,
): TrafficIncident[] {
    if (minDelaySeconds === 0) return incidents;
    const excluded = new Set(excludeCategories);
    return incidents.filter((inc) => {
        const cat = inc.properties.category;
        const delay = inc.properties.delayInSeconds ?? 0;
        // Only exclude incidents whose category is in the exclude set AND delay is below threshold
        if (excluded.has(cat) && delay < minDelaySeconds) return false;
        return true;
    });
}

/**
 * Convert any incident (Point or LineString) to a Point feature carrying the
 * original incident's `properties.id` in a `_incidentId` property.
 */
function toPoint(incident: TrafficIncident): Feature<Point, { _incidentId: string }> {
    const id = incident.properties.id;
    if (incident.geometry.type === 'Point') {
        return turf.point(incident.geometry.coordinates, { _incidentId: id });
    }
    // LineString → centroid
    const center = turf.centroid(incident);
    center.properties = { _incidentId: id };
    return center as Feature<Point, { _incidentId: string }>;
}

/**
 * Collect road numbers from member incidents, sorted by frequency (desc),
 * deduplicated.
 */
function collectPrimaryRoads(members: TrafficIncident[]): string[] {
    const freq = new Map<string, number>();
    for (const inc of members) {
        for (const road of inc.properties.roadNumbers ?? []) {
            freq.set(road, (freq.get(road) ?? 0) + 1);
        }
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([road]) => road);
}

/**
 * Collect the most-frequent incident category across member incidents;
 * "incident" when none present.
 */
function collectPrimaryCategory(members: TrafficIncident[]): string {
    const freq = new Map<string, number>();
    for (const inc of members) {
        const cat = inc.properties.category;
        if (cat) freq.set(cat, (freq.get(cat) ?? 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'incident';
}

// ---------------------------------------------------------------------------
// ID stability — Jaccard-index matching
// ---------------------------------------------------------------------------

/**
 * Match fresh clusters to previous clusters using Jaccard similarity of
 * member IDs. Returns a map from fresh-cluster index to the previous
 * cluster's `id`. Uses a greedy best-overlap-first, 1:1 assignment.
 */
export function matchPreviousClusters(
    fresh: Pick<ClusterResult, 'memberIds'>[],
    previous: Pick<ClusterResult, 'id' | 'memberIds'>[],
): Map<number, string> {
    // Build all (freshIdx, prevIdx, overlap) pairs. Hoist the previous-side Sets
    // so each is built once, not once per fresh cluster (O(F+P) builds, not O(F*P)).
    const prevSets = previous.map((p) => new Set(p.memberIds));
    const pairs: { freshIdx: number; prevIdx: number; overlap: number }[] = [];
    for (let fi = 0; fi < fresh.length; fi++) {
        const freshSet = new Set(fresh[fi].memberIds);
        for (let pi = 0; pi < previous.length; pi++) {
            const prevSet = prevSets[pi];
            let intersection = 0;
            for (const id of freshSet) {
                if (prevSet.has(id)) intersection++;
            }
            const union = freshSet.size + prevSet.size - intersection;
            const jaccard = union === 0 ? 0 : intersection / union;
            if (jaccard >= OVERLAP_THRESHOLD) {
                pairs.push({ freshIdx: fi, prevIdx: pi, overlap: jaccard });
            }
        }
    }

    // Sort by overlap descending for greedy assignment
    pairs.sort((a, b) => b.overlap - a.overlap);

    const result = new Map<number, string>();
    const usedFresh = new Set<number>();
    const usedPrev = new Set<number>();
    for (const { freshIdx, prevIdx, overlap: _ } of pairs) {
        if (usedFresh.has(freshIdx) || usedPrev.has(prevIdx)) continue;
        result.set(freshIdx, previous[prevIdx].id);
        usedFresh.add(freshIdx);
        usedPrev.add(prevIdx);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Trend detection
// ---------------------------------------------------------------------------

/**
 * Classify a cluster's trend from its rolling delay window with hysteresis:
 * two consecutive moves in the same direction AND a net change past
 * {@link TREND_NET_THRESHOLD}. This rides out per-tick jitter that single-step
 * comparison would flicker on. Needs ≥3 samples; below that, "steady".
 */
export function classifyTrend(samples: number[]): ClusterTrend {
    if (samples.length < 3) return 'steady';
    const [a, b, c] = samples.slice(-3);
    const net = (c - a) / Math.max(a, 1);
    if (b > a && c > b && net > TREND_NET_THRESHOLD) return 'growing';
    if (b < a && c < b && net < -TREND_NET_THRESHOLD) return 'fading';
    return 'steady';
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Cluster traffic incidents using DBSCAN and return ranked, annotated groups.
 *
 * @param incidents  - The incidents to cluster.
 * @param params     - Tuneable parameters (eps, minMembers, maxClusters, preFilter).
 * @param previous   - Previous clustering output's `groups` for ID stability
 *                     and trend detection. Pass `undefined` on first run.
 * @param sampledAt  - Canonical moment the `incidents` snapshot is from. Used to
 *                     key the trend window per moment, not per call.
 * @param previousSampledAt - Moment `previous` was sampled. When `sampledAt` does
 *                     not advance past it, the latest trend sample is overwritten
 *                     rather than appended (so a same-snapshot re-run can't
 *                     double-count). Omit both to always append (e.g. in tests).
 */
export function runClustering(
    incidents: TrafficIncident[],
    params: ClusteringParams,
    previous?: ClusterResult[],
    sampledAt?: number,
    previousSampledAt?: number,
): ClusteringOutput {
    if (incidents.length === 0) return { groups: [] };

    // --- 1. Pre-filter ---
    const excludeCategories = params.preFilter?.excludeCategories ?? DEFAULT_EXCLUDE_CATEGORIES;
    const minDelaySeconds = params.preFilter?.minDelaySeconds ?? DEFAULT_MIN_DELAY_SECONDS;
    const filtered = preFilter(incidents, excludeCategories, minDelaySeconds);
    if (filtered.length === 0) return { groups: [] };

    // --- 2. Point conversion ---
    const incidentById = new Map<string, TrafficIncident>();
    for (const inc of filtered) incidentById.set(inc.properties.id, inc);

    const points = filtered.map(toPoint);
    const pointsFC = turf.featureCollection(points);

    // --- 3. DBSCAN ---
    const eps = params.eps ?? DEFAULT_EPS;
    const minMembers = params.minMembers ?? DEFAULT_MIN_MEMBERS;
    const clustered = turf.clustersDbscan(pointsFC, eps, { minPoints: minMembers });

    // --- 4. Extract clusters ---
    // Group points by their dbscan cluster number (noise points have cluster = undefined or -1)
    const clusterMap = new Map<number, Feature<Point, { _incidentId: string }>[]>();
    for (const feat of clustered.features) {
        const clusterNum = (feat.properties as { cluster?: number }).cluster;
        if (clusterNum === undefined || clusterNum < 0) continue;
        let group = clusterMap.get(clusterNum);
        if (!group) {
            group = [];
            clusterMap.set(clusterNum, group);
        }
        group.push(feat as Feature<Point, { _incidentId: string }>);
    }

    const maxClusters = params.maxClusters ?? DEFAULT_MAX_CLUSTERS;

    const rawClusters: Omit<ClusterResult, 'id' | 'trend' | 'delaySamples'>[] = [];
    for (const [, groupPoints] of clusterMap) {
        const memberIds = groupPoints.map((p) => p.properties._incidentId);
        const members = memberIds
            .map((id) => incidentById.get(id))
            .filter((inc): inc is TrafficIncident => inc !== undefined);

        const totalDelaySeconds = members.reduce((sum, inc) => sum + (inc.properties.delayInSeconds ?? 0), 0);
        const peakDelaySeconds = members.reduce((max, inc) => Math.max(max, inc.properties.delayInSeconds ?? 0), 0);

        const groupFC = turf.featureCollection(groupPoints);
        const centroidFeature = turf.centroid(groupFC);
        const centroid = centroidFeature.geometry.coordinates as [number, number];

        let diameterKm = 0;
        if (groupPoints.length >= 2) {
            const bbox = turf.bbox(groupFC);
            // bbox = [minLng, minLat, maxLng, maxLat]
            diameterKm = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
        }

        const primaryRoads = collectPrimaryRoads(members);

        rawClusters.push({
            centroid,
            memberIds,
            size: members.length,
            totalDelaySeconds,
            peakDelaySeconds,
            diameterKm,
            primaryRoads,
            primaryCategory: collectPrimaryCategory(members),
        });
    }

    // --- 5. Sort by totalDelaySeconds desc, take top maxClusters ---
    rawClusters.sort((a, b) => b.totalDelaySeconds - a.totalDelaySeconds);
    const topClusters = rawClusters.slice(0, maxClusters);

    // --- 6. ID stability ---
    const idMapping = previous
        ? matchPreviousClusters(topClusters as ClusterResult[], previous)
        : new Map<number, string>();

    // Build a map from previous id → previous ClusterResult for trend detection
    const prevById = new Map<string, ClusterResult>();
    if (previous) {
        for (const p of previous) prevById.set(p.id, p);
    }

    // A genuinely new tick extends the window; a same-moment re-run (ID-stability
    // re-read of an unchanged snapshot) overwrites the latest sample instead.
    const advancing = sampledAt === undefined || previousSampledAt === undefined || sampledAt > previousSampledAt;

    // --- 7. Assemble final ClusterResults, threading the trend window forward ---
    const groups: ClusterResult[] = topClusters.map((raw, idx) => {
        const matchedId = idMapping.get(idx);
        // Disjoint DBSCAN membership makes the lowest member id a stable
        // per-cluster disambiguator, so two pockets sharing a rounded centroid
        // can't collide on the fallback id.
        const id =
            matchedId ??
            `cluster-${raw.centroid[0].toFixed(3)}-${raw.centroid[1].toFixed(3)}-${[...raw.memberIds].sort()[0] ?? idx}`;
        const prev = matchedId ? prevById.get(matchedId) : undefined;

        // A matched cluster threads its rolling delay window forward; a fresh one starts new.
        const priorSamples = prev?.delaySamples ?? [];
        const delaySamples = prev
            ? (advancing
                  ? [...priorSamples, raw.totalDelaySeconds]
                  : [...priorSamples.slice(0, -1), raw.totalDelaySeconds]
              ).slice(-TREND_WINDOW)
            : [raw.totalDelaySeconds];
        // Key the label on sample count, not on whether a prior cluster matched:
        // a single sample (first sighting, or a re-read collapsed back to one) is
        // "new"; two or more is enough for classifyTrend to weigh in.
        const trend: ClusterTrend = delaySamples.length === 1 ? 'new' : classifyTrend(delaySamples);

        return {
            id,
            centroid: raw.centroid,
            memberIds: raw.memberIds,
            size: raw.size,
            totalDelaySeconds: raw.totalDelaySeconds,
            peakDelaySeconds: raw.peakDelaySeconds,
            diameterKm: raw.diameterKm,
            primaryRoads: raw.primaryRoads,
            primaryCategory: raw.primaryCategory,
            trend,
            delaySamples,
        };
    });

    return { groups };
}
