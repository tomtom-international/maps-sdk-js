import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { useSyncExternalStore } from 'react';

// Single client-side source of truth for analysis results. Tools publish their FULL structured result
// here (a side effect of execute); panels and the HTML report read from here. The agent gets only a
// terse headline (see each tool), so the chat can't duplicate what the panels already show.
//
// GEOJSON-FEATURE MODEL: every geographic result is a GeoJSON Feature, mirroring how the agent-toolkit
// models its own state (Place = Feature<Point>, PolygonFeature, FeatureCollection). A site/pocket is a
// `Feature<Point, …Props>` — its coordinates are the geometry, its analysis attributes live in
// `properties` — and a set of them is a `FeatureCollection`. Catchment / hex / overlap polygons travel
// alongside as `PolygonFeature`s keyed by the matching feature `id` (the same points-plus-geometries
// shape the toolkit's PlacesEntry uses). This lets a result be handed to the toolkit's BYOD /
// customGeometries / processData machinery later with no reshaping. Read coordinates back with
// `getPosition(feature)` from @tomtom-org/maps-sdk/core.
//
// Per-kind hooks read a stable slice reference, so publishing (say) a ranking does not re-render the
// profile panel — only the changed slice's subscribers re-render.

export type ScoreFactor = 'reach' | 'demand' | 'competition' | 'accessibility';

// Note: the ranking "demand" factor is income/spend power and is labelled "Spend power" to avoid
// clashing with findWhitespace's separate "Demand" metric (anchor-POI density). See methodology.ts.
export const FACTOR_LABELS: Record<ScoreFactor, string> = {
    reach: 'Reach',
    demand: 'Spend power',
    competition: 'Competition',
    accessibility: 'Accessibility',
};

/** Count + whether it hit the search window cap (so "1000" reads as a floor, not an exact count). */
export type Counted = { count: number | null; capped: boolean };

// --- Profile -----------------------------------------------------------------------------------------

/** Attributes of a profiled site, carried in its Point feature's `properties`. */
export type ProfileSiteProps = {
    label: string;
    mode: 'walking' | 'driving';
    basis: string;
    catchmentKm2: number;
    households: Counted; // Reach proxy — address (PointAddress) count in the catchment
    competitors: {
        count: number | null;
        capped: boolean;
        nearestMeters: number | null;
        nearestLabel: string | null;
        matchedBy: string;
    };
    parking: { count: number | null; nearestMeters: number | null } | null;
    areaMakeup: { key: string; label: string; count: number | null; capped: boolean }[];
    notes: string[];
    /** Inputs needed to re-run this profile from the panel with a tweaked catchment size. */
    rerun: {
        address: string;
        concept: string;
        includeParking: boolean;
        walkReachMeters: number;
        driveMinutes: number;
        competitorCategories?: string[];
    };
};

export type ProfileResult = {
    /** The profiled site as a Point feature (geometry = the geocoded centre; attributes in properties). */
    site: Feature<Point, ProfileSiteProps>;
    /** The catchment polygon (walk circle or drive isochrone); null if it could not be built. */
    catchment: PolygonFeature | null;
};

// --- Ranking -----------------------------------------------------------------------------------------

/** Per-site ranking attributes, carried in each site's Point feature `properties`. */
export type RankedSiteProps = {
    rank: number;
    label: string;
    score: number; // 0-100, or null-as-excluded handled via `excluded`
    /** Glass-box: each factor's points contribution to the composite (sums ≈ score). */
    breakdown: { factor: ScoreFactor; points: number }[];
    excluded?: { reason: string };
    households: number | null;
    competitorCount: number | null;
    nearestCompetitorMeters: number | null;
    parkingCount: number | null;
    /** Raw higher-is-better factor values, so the panel can re-score live as weights are dragged. */
    factors: Partial<Record<ScoreFactor, number | null>>;
};

/** A ranked candidate site: a Point feature whose geometry is the geocoded centre. */
export type RankedSite = Feature<Point, RankedSiteProps>;

export type RankingResult = {
    concept: string;
    mode: string;
    weights: Record<ScoreFactor, number>;
    scoredOn: ScoreFactor[];
    skipped: { factor: ScoreFactor; reason: string }[];
    gates: string[]; // human-readable gate descriptions applied this run
    confidence: 'high' | 'medium' | 'low';
    competitorsMatchedBy: string;
    /** The candidate sites as a FeatureCollection of Point features (each feature `id` is its label). */
    sites: FeatureCollection<Point, RankedSiteProps>;
    /** Each site's catchment polygon, `id`-matched to the corresponding site feature. */
    catchments: PolygonFeature[];
};

// --- Catchment overlap (cannibalization) -------------------------------------------------------------

/** Attributes of a site in an overlap check (the proposed site, or an existing one). */
export type OverlapSiteProps = { label: string; catchmentKm2: number };

export type OverlapPair = {
    /** The existing site as a Point feature. */
    existing: Feature<Point, OverlapSiteProps>;
    /** The intersection of the proposed and existing catchments; null when they don't overlap. */
    overlap: PolygonFeature | null;
    overlapKm2: number;
    pctOfProposed: number;
    pctOfExisting: number;
};

export type OverlapResult = {
    /** The proposed site as a Point feature (properties carry its catchment area). */
    proposed: Feature<Point, OverlapSiteProps>;
    /** The proposed site's catchment polygon. */
    proposedCatchment: PolygonFeature;
    basis: string;
    sharedKm2: number;
    proposedSharedPct: number;
    pairs: OverlapPair[];
};

// --- Whitespace --------------------------------------------------------------------------------------

/** Per-pocket whitespace attributes, carried in each pocket's Point (centre) feature `properties`. */
export type WhitespacePocketProps = {
    color: string;
    opportunity: number;
    demand: number;
    /** Normalized 0–1 demand and peer-proximity components, so the panel can re-blend them live. */
    demandNorm: number;
    peerNorm: number;
    /** Address points within the radius (residential-density signal); null when household demand is off. */
    households: number | null;
    nearestTargetMeters: number | null;
    beyondWalk: boolean;
    /** The closest demand POIs to this pocket (name + category + metres), nearest first. */
    nearestDemand: { name: string; category: string; meters: number }[];
};

/** An opportunity pocket: a Point feature whose geometry is the pocket centre. */
export type WhitespacePocket = Feature<Point, WhitespacePocketProps>;

export type WhitespaceResult = {
    area: string;
    areaKm2: number;
    colocation: 'avoid' | 'seek';
    goal: string;
    targetMatchedBy: string;
    anchorsMatchedBy: string;
    pocketsMeetingGoal: number;
    /** The opportunity pockets as a FeatureCollection of Point (centre) features. */
    pockets: FeatureCollection<Point, WhitespacePocketProps>;
    /** The clipped hex polygon for each pocket, `id`-matched to the corresponding pocket feature. */
    hexes: PolygonFeature[];
    /** Demand-POI categories actually drawn, with their map colour — the map's dynamic legend. */
    demandLegend: { label: string; color: string }[];
    /** Every demand category found in the area with its POI count — fuller than the colour legend. */
    demandComposition: { category: string; count: number }[];
    warnings: string[];
};

// --- Feature construction helpers --------------------------------------------------------------------

/** Build a `Feature<Point, P>` with a stable `id` from a [lng, lat] position and its attributes. */
export const pointFeature = <P>(position: [number, number], id: string, properties: P): Feature<Point, P> => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: position },
    properties,
});

/** Wrap Point features in a `FeatureCollection<Point, P>`. */
export const pointCollection = <P>(features: Feature<Point, P>[]): FeatureCollection<Point, P> => ({
    type: 'FeatureCollection',
    features,
});

// --- Store plumbing ----------------------------------------------------------------------------------

type Results = {
    profile: ProfileResult | null;
    ranking: RankingResult | null;
    overlap: OverlapResult | null;
    whitespace: WhitespaceResult | null;
};

let current: Results = { profile: null, ranking: null, overlap: null, whitespace: null };
const listeners = new Set<() => void>();
const emit = (): void => {
    for (const listener of listeners) listener();
};
const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const publishProfile = (result: ProfileResult): void => {
    current = { ...current, profile: result };
    emit();
};
export const publishRanking = (result: RankingResult): void => {
    current = { ...current, ranking: result };
    emit();
};
export const publishOverlap = (result: OverlapResult): void => {
    current = { ...current, overlap: result };
    emit();
};
export const publishWhitespace = (result: WhitespaceResult): void => {
    current = { ...current, whitespace: result };
    emit();
};

export const useProfile = (): ProfileResult | null => useSyncExternalStore(subscribe, () => current.profile);
export const useRanking = (): RankingResult | null => useSyncExternalStore(subscribe, () => current.ranking);
export const useOverlap = (): OverlapResult | null => useSyncExternalStore(subscribe, () => current.overlap);
export const useWhitespace = (): WhitespaceResult | null => useSyncExternalStore(subscribe, () => current.whitespace);

/** Synchronous snapshot for the HTML report builder (reads everything analyzed this session). */
export const getResultsSnapshot = (): Results => current;
