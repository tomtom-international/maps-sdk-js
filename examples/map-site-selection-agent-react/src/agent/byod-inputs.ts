import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

// Helpers that let the domain tools CONSUME a bring-your-own-data layer the user already loaded via
// the toolkit's `addByodSource` (stored on `state.byod`). The toolkit owns ingestion — fetch, scheme /
// size / timeout checks, parsing, profiling and rendering — so nothing here re-implements
// any of that; we only read `state.byod.findById(id).data` (a GeoJSON FeatureCollection) and join it
// against an analysis geometry with turf. See the PR description.

// Read a loaded BYOD entry's FeatureCollection, or throw a message the agent can relay to the user.
export const requireByodFeatures = (state: ToolState, entryId: string): FeatureCollection => {
    const entry = state.byod.findById(entryId);
    if (!entry) {
        const loaded = state.byod.entries.map((candidate) => candidate.id);
        const hint = loaded.length ? ` Loaded layers: ${loaded.join(', ')}.` : ' No BYOD layers are loaded yet.';
        throw new Error(`No BYOD layer "${entryId}".${hint} Load one with addByodSource first.`);
    }
    return entry.data;
};

// Fallback label keys, in priority order — a last resort when the caller doesn't name a label
// property. The preferred path is for the LLM to pick the label field from the schema `addByodSource`
// profiled (see `byodCandidateSites`'s `labelProperty`); this heuristic only kicks in when it doesn't,
// or when the named property is missing/blank on a given feature.
const LABEL_KEYS = ['label', 'name', 'title', 'site', 'address', 'id'];

// Read one property as a display string: a non-blank string wins, a finite number is stringified,
// anything else (null / object / empty) is treated as absent.
const readLabel = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
};

// Resolve a feature's label: the caller-named `labelProperty` first (the schema field the LLM chose
// from the addByodSource profile), then the LABEL_KEYS heuristic, then the positional fallback.
const labelOf = (
    properties: Record<string, unknown> | null | undefined,
    fallback: string,
    labelProperty?: string,
): string => {
    if (properties) {
        if (labelProperty) {
            const chosen = readLabel(properties[labelProperty]);
            if (chosen) return chosen;
        }
        for (const key of LABEL_KEYS) {
            const value = readLabel(properties[key]);
            if (value) return value;
        }
    }
    return fallback;
};

/** A candidate site sourced from a BYOD layer: every feature becomes one labelled site. */
export type ByodCandidate = { label: string; position: [number, number] };

// Reduce any BYOD feature to a single representative [lng, lat]: a Point stays as-is, and a Polygon
// (parcel, cell), LineString (frontage) or any other geometry collapses to its centroid — so a
// polygon layer is not silently dropped when a tool needs point candidates. Returns null only for
// empty/degenerate geometry that turf can't reduce to a finite point.
const featureCentroid = (feature: Feature): [number, number] | null => {
    const geometry = feature.geometry;
    if (!geometry) return null;
    if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates;
        return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
    }
    try {
        const [lng, lat] = turf.centroid(feature).geometry.coordinates;
        return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
    } catch {
        return null;
    }
};

// Turn a BYOD layer into candidate sites — ONE per feature, regardless of geometry type. Points keep
// their coordinates; polygons/lines are represented by their centroid (see featureCentroid). Labels
// come from `labelProperty` when the caller names one (the schema field the LLM picked from the
// addByodSource profile), otherwise the LABEL_KEYS heuristic; the index is the last-resort fallback.
export const byodCandidateSites = (features: FeatureCollection, labelProperty?: string): ByodCandidate[] => {
    const sites: ByodCandidate[] = [];
    features.features.forEach((feature, index) => {
        const position = featureCentroid(feature);
        if (!position) return;
        sites.push({
            label: labelOf(feature.properties, `Site ${index + 1}`, labelProperty),
            position,
        });
    });
    return sites;
};

// The share of `feature` that lies within `area`, in [0, 1]. A Point is all-or-nothing (1 inside, 0
// outside). A Polygon/MultiPolygon is area-weighted — the intersected area ÷ the feature's own area —
// so a demand cell only half-inside a catchment contributes half its value (areal interpolation),
// not all of it. Other geometries (lines) fall back to all-or-nothing by intersection.
const overlapWeight = (feature: Feature, area: Polygon | MultiPolygon): number => {
    const geometry = feature.geometry;
    if (!geometry) return 0;
    if (geometry.type === 'Point') {
        return turf.booleanPointInPolygon(geometry.coordinates, area) ? 1 : 0;
    }
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        const whole = turf.area(feature);
        if (whole <= 0) return 0;
        const clipped = turf.intersect(
            turf.featureCollection([feature as Feature<Polygon | MultiPolygon>, turf.feature(area)]),
        );
        return clipped ? Math.min(1, turf.area(clipped) / whole) : 0;
    }
    return turf.booleanIntersects(feature, area) ? 1 : 0;
};

// Outcome of aggregating a BYOD demand layer within one catchment. `matched` is how many features
// carried the summed property AND overlapped the area (0 → no usable data, so the scorer skips the factor).
type DemandInArea = { value: number; matched: number };

/**
 * Sum the numeric `property` of a BYOD layer over the features that fall within `area`, weighted by
 * how much of each feature the area actually covers (see `overlapWeight`): points count in full when
 * inside, polygons contribute in proportion to the share that lies in the catchment. This is the
 * spend-power / demand signal that `rankSites` feeds into the otherwise-null `demand` factor.
 *
 * `property` is REQUIRED and must be a genuine measure (e.g. population, spend, income): the caller
 * picks it from the layer's `addByodSource` profile. We deliberately do NOT guess a property — the
 * first numeric field is often an id/code, which would sum to something meaningless.
 */
export const sumNumericInArea = (
    features: FeatureCollection,
    area: Polygon | MultiPolygon,
    property: string,
): DemandInArea => {
    let total = 0;
    let matched = 0;
    for (const feature of features.features) {
        const raw = feature.properties?.[property];
        if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
        const weight = overlapWeight(feature, area);
        if (weight <= 0) continue;
        total += raw * weight;
        matched += 1;
    }
    return { value: total, matched };
};
