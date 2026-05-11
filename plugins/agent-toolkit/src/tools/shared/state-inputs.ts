/**
 * @module agent-toolkit-tools
 */

import type { Place, Places, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { type GeometriesId, geometriesIdSchema } from './geometries-id';

// Per-source skip record. `source` carries the original tagged id so the
// caller can present the failure with the same `{kind, id}` shape the agent
// passed in, and `reason` is a free-form explanation.
/** @ignore */
export const skippedSourceSchema = z.object({
    source: geometriesIdSchema,
    reason: z.string(),
});

/** @ignore */
export type SkippedSource = z.infer<typeof skippedSourceSchema>;

/** @ignore */
export type AffectedEntry = {
    /** Unqualified entry id within the owning slice. */
    id: string;
    /** Which slice the entry lives in (only kinds that carry analyses are tracked). */
    kind: 'places' | 'custom';
};

/** @ignore */
export type CollectedGeometries = {
    geometries: PolygonFeature[];
    /** Place objects whose footprints contributed (used to seed processGeometries provenance). */
    sourcePlaces: Place[];
    /** Entries that should receive analyses (places + customGeometries; ranges don't carry analyses). */
    affectedEntries: AffectedEntry[];
    skipped: SkippedSource[];
    /** Tagged ids that contributed at least one polygon, in input order. */
    contributingSourceIds: GeometriesId[];
};

type ParsedByKind = {
    place: GeometriesId[];
    places: GeometriesId[];
    ranges: GeometriesId[];
    custom: GeometriesId[];
};

const groupByKind = (sources: readonly GeometriesId[]): ParsedByKind => {
    const out: ParsedByKind = { place: [], places: [], ranges: [], custom: [] };
    for (const source of sources) out[source.kind].push(source);
    return out;
};

const formatSkipReason = (skip: SkippedSource): string => `${skip.source.kind}:${skip.source.id}: ${skip.reason}`;

// Walks `places` inputs, validates each entry, and emits the place ids that
// have a geometry data source. Returns a back-pointer map so per-place
// outcomes can be attributed to the requesting entry afterwards.
const expandPlacesEntries = (
    sources: readonly GeometriesId[],
    state: ToolState,
): { placeIds: string[]; placeIdToEntry: Map<string, string>; skipped: SkippedSource[] } => {
    const placeIds: string[] = [];
    const placeIdToEntry = new Map<string, string>();
    const skipped: SkippedSource[] = [];
    const seen = new Set<string>();

    for (const source of sources) {
        const entry = state.places.entries.find((e) => e.id === source.id);
        if (!entry) {
            skipped.push({
                source,
                reason: 'No places entry with this id in session state. Use `recallGeometries` to list available ids.',
            });
            continue;
        }
        let added = 0;
        for (const place of entry.places) {
            if (!place.properties.dataSources?.geometry?.id || typeof place.id !== 'string') continue;
            added++;
            if (!placeIdToEntry.has(place.id)) placeIdToEntry.set(place.id, source.id);
            if (seen.has(place.id)) continue;
            seen.add(place.id);
            placeIds.push(place.id);
        }
        if (added === 0) {
            skipped.push({
                source,
                reason: 'Places entry has no places with a geometry data source (e.g. addresses and streets often lack one).',
            });
        }
    }
    return { placeIds, placeIdToEntry, skipped };
};

// Shallow-clone a feature and stamp `properties._source` with the tagged id it came from.
// The original feature lives in state (place-geometry cache, range polygons, custom-entry
// features) — mutating it directly would corrupt subsequent reads. Cloning keeps the
// per-sandbox-run tag scoped to the call.
const tagFeatureSource = (feature: PolygonFeature, source: GeometriesId): PolygonFeature => ({
    ...feature,
    properties: { ...(feature.properties ?? {}), _source: source },
});

// Resolves one place id to its boundary polygon. Returns `success` with the
// fetched feature, or `skip` with a reason the caller records as a `place`
// skip. Pulled out of `collectInputGeometries` so the orchestrator stays
// under Biome's cognitive-complexity ceiling.
type PlaceResolution =
    | { kind: 'success'; place: Place; feature: PolygonFeature; ownerEntryId: string }
    | { kind: 'skip'; reason: string };

const resolvePlaceGeometry = async (placeId: string, state: ToolState): Promise<PlaceResolution> => {
    const lookup = state.places.findPlaceById(placeId);
    if (!lookup) {
        return {
            kind: 'skip',
            reason:
                'No place with this id in session state. ' +
                'Use `recallGeometries` to list known places ids and entries.',
        };
    }
    if (!lookup.place.properties.dataSources?.geometry?.id) {
        return {
            kind: 'skip',
            reason: 'Place has no geometry data source (e.g. addresses and streets often lack one).',
        };
    }
    try {
        const feature = await state.places.fetchPlaceGeometry(placeId);
        if (!feature) return { kind: 'skip', reason: 'Geometry Data service returned no feature for this place.' };
        return { kind: 'success', place: lookup.place, feature, ownerEntryId: lookup.entryId };
    } catch (error) {
        return {
            kind: 'skip',
            reason: `Geometry fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};

// Flatten range polygons from each `ranges` input. Self-contained so the
// orchestrator stays under Biome's cognitive-complexity ceiling.
const collectRangePolygons = (
    sources: readonly GeometriesId[],
    state: ToolState,
): { features: PolygonFeature[]; contributingIds: Set<string>; skipped: SkippedSource[] } => {
    const features: PolygonFeature[] = [];
    const contributingIds = new Set<string>();
    const skipped: SkippedSource[] = [];
    for (const source of sources) {
        const entry = state.ranges.entries.find((e) => e.id === source.id);
        if (!entry) {
            skipped.push({ source, reason: 'No ranges entry with this id in session state.' });
            continue;
        }
        const polygons = entry.ranges.flatMap((r) => r.polygon?.features ?? []);
        if (polygons.length === 0) {
            skipped.push({
                source,
                reason: 'Ranges entry has no polygons — recompute via findReachableAreas first.',
            });
            continue;
        }
        for (const polygon of polygons) features.push(tagFeatureSource(polygon, source));
        contributingIds.add(source.id);
    }
    return { features, contributingIds, skipped };
};

// Read polygons from each `custom` input.
const collectCustomGeometries = (
    sources: readonly GeometriesId[],
    state: ToolState,
): { features: PolygonFeature[]; contributingIds: Set<string>; skipped: SkippedSource[] } => {
    const features: PolygonFeature[] = [];
    const contributingIds = new Set<string>();
    const skipped: SkippedSource[] = [];
    for (const source of sources) {
        const entry = state.customGeometries.findById(source.id);
        if (!entry) {
            skipped.push({
                source,
                reason: 'No custom-geometries entry with this id in session state. Use `recallGeometries` to list available ids.',
            });
            continue;
        }
        if (entry.features.length === 0) {
            skipped.push({ source, reason: 'Custom-geometries entry is empty.' });
            continue;
        }
        for (const feature of entry.features) features.push(tagFeatureSource(feature, source));
        contributingIds.add(source.id);
    }
    return { features, contributingIds, skipped };
};

/**
 * Resolves a heterogeneous list of tagged geometry ids into a single
 * `PolygonFeature[]`. The id's `kind` tells the helper which slice to
 * consult: `place` and `places` go through the per-place fetch pipeline
 * (Geometry Data service for footprints, lazy cached on the places-entry);
 * `ranges` flattens isochrone polygons already in memory; `custom` reads a
 * derived entry produced by a previous `processGeometries`.
 *
 * Validates the input precondition (at least one id) and the output
 * postcondition (at least one polygon collected). Returns `affectedEntries`
 * — the entries that should carry analyses computed from these geometries
 * (places-entries from `place`/`places` inputs, custom-entries from
 * `custom` inputs; ranges entries don't carry analyses, so they're not
 * included here).
 *
 * @ignore
 */
export const collectInputGeometries = async (
    sources: readonly GeometriesId[],
    state: ToolState,
): Promise<{ value: CollectedGeometries } | { error: string }> => {
    if (sources.length === 0) {
        return {
            error:
                '`geometriesEntryIDs` must contain one or more tagged ids ' +
                "(e.g. `{ kind: 'places', id: <entryId> }`, `{ kind: 'place', id: <placeId> }`, " +
                "`{ kind: 'ranges', id: <entryId> }`, `{ kind: 'custom', id: <entryId> }`). " +
                'Use `recallGeometries` to list available ids.',
        };
    }

    const grouped = groupByKind(sources);

    // Expand `places` entries into individual place ids, then merge them with
    // any explicit `place` inputs. The merged list runs through the single
    // per-place pipeline so fetches and skip semantics stay uniform.
    const expanded = expandPlacesEntries(grouped.places, state);
    const skipped: SkippedSource[] = [...expanded.skipped];

    const seenPlaceIds = new Set<string>();
    const mergedPlaceIds: string[] = [];
    const placeIdSourceQualified = new Map<string, GeometriesId>();
    for (const source of grouped.place) {
        if (seenPlaceIds.has(source.id)) continue;
        seenPlaceIds.add(source.id);
        mergedPlaceIds.push(source.id);
        placeIdSourceQualified.set(source.id, source);
    }
    for (const id of expanded.placeIds) {
        if (seenPlaceIds.has(id)) continue;
        seenPlaceIds.add(id);
        mergedPlaceIds.push(id);
    }

    const geometries: PolygonFeature[] = [];
    const sourcePlaces: Place[] = [];
    const affectedPlacesEntries = new Set<string>();
    const contributingPlaceIds = new Set<string>();
    const contributingPlacesEntries = new Set<string>();

    for (const placeId of mergedPlaceIds) {
        const result = await resolvePlaceGeometry(placeId, state);
        const explicitPlaceSource = placeIdSourceQualified.get(placeId);
        const fromPlacesEntry = expanded.placeIdToEntry.get(placeId);
        if (result.kind === 'skip') {
            // Per-place failure: report it as `place:<id>` regardless of how
            // the place was introduced. That points the agent at the exact
            // failing feature instead of blaming the parent entry.
            const skipSource: GeometriesId = explicitPlaceSource ?? { kind: 'place', id: placeId };
            skipped.push({ source: skipSource, reason: result.reason });
            continue;
        }
        // Tag with the source the agent passed in: a `place:<placeId>` direct input or a
        // `places:<entryId>` parent. Keeps the sandbox-side `_source` aligned with the input
        // shape rather than leaking the internal expansion.
        const featureSource: GeometriesId =
            explicitPlaceSource ??
            (fromPlacesEntry ? { kind: 'places', id: fromPlacesEntry } : { kind: 'place', id: placeId });
        geometries.push(tagFeatureSource(result.feature, featureSource));
        sourcePlaces.push(result.place);
        affectedPlacesEntries.add(result.ownerEntryId);
        if (explicitPlaceSource) contributingPlaceIds.add(explicitPlaceSource.id);
        if (fromPlacesEntry) contributingPlacesEntries.add(fromPlacesEntry);
    }

    const ranges = collectRangePolygons(grouped.ranges, state);
    geometries.push(...ranges.features);
    skipped.push(...ranges.skipped);

    const custom = collectCustomGeometries(grouped.custom, state);
    geometries.push(...custom.features);
    skipped.push(...custom.skipped);
    const affectedCustomEntries = custom.contributingIds;

    if (geometries.length === 0) {
        return {
            error: `No input geometries available. ${skipped.map(formatSkipReason).join(' | ')}`,
        };
    }

    const affectedEntries: AffectedEntry[] = [
        ...[...affectedPlacesEntries].map((id): AffectedEntry => ({ id, kind: 'places' })),
        ...[...affectedCustomEntries].map((id): AffectedEntry => ({ id, kind: 'custom' })),
    ];

    // Preserve the caller's input order in `contributingSourceIds`.
    const contributingSourceIds = sources.filter((source) => {
        switch (source.kind) {
            case 'place':
                return contributingPlaceIds.has(source.id);
            case 'places':
                return contributingPlacesEntries.has(source.id);
            case 'ranges':
                return ranges.contributingIds.has(source.id);
            case 'custom':
                return affectedCustomEntries.has(source.id);
        }
    });

    return {
        value: {
            geometries,
            sourcePlaces,
            affectedEntries,
            skipped,
            contributingSourceIds,
        },
    };
};

/**
 * Resolves `placesEntryIDs` into a `Record<entryId, Places>` map for
 * sandbox cross-referencing. Returns `{ value: undefined }` when no IDs
 * are supplied so callers can pass the result straight into the sandbox.
 * Mirrors the resolution used by analyse-routes and process-routes.
 *
 * @ignore
 */
export const findPlacesByEntry = (
    placesEntryIDs: readonly string[] | undefined,
    state: ToolState,
): { value: Record<string, Places> | undefined } | { error: string } => {
    if (!placesEntryIDs?.length) return { value: undefined };
    const placesByEntry: Record<string, Places> = {};
    for (const id of placesEntryIDs) {
        const placesEntry = state.places.entries.find((entry) => entry.id === id);
        if (!placesEntry) {
            return { error: `No places entry found with id "${id}". Use recallPlaces to list available IDs.` };
        }
        placesByEntry[id] = { type: 'FeatureCollection', features: placesEntry.places } as Places;
    }
    return { value: placesByEntry };
};
