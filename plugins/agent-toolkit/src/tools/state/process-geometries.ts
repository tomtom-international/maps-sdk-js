/**
 * @module agent-toolkit-tools
 */

import type { CommonPlaceProps, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    applyFitOnMap,
    buildSandboxCodePrompt,
    collectInputGeometries,
    FIT_ON_MAP_DOC,
    type FitOnMapInput,
    fittedReportSchema,
    GEOMETRIES_PROPS_DOC,
    GEOMETRIES_SCHEMA_DOC,
    GEOMETRIES_SKIPPED_DESC,
    GEOMETRIES_SOURCE_IDS_DESC,
    type GeometriesId,
    geometriesEntryIDsSchema,
    geometriesIdSchema,
    hidePreviousEntriesSchema,
    hidePreviousShownEntries,
    isFitOnMapInput,
    isPolygonFeature,
    isPolygonFeatureArray,
    placesEntryIdHintSchema,
    runSandboxedFn,
    showModeSchema,
    skippedSourceSchema,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the process-geometries tool. */
export const processGeometriesOutputSchema = z.union([
    z.object({
        geometriesEntryId: geometriesIdSchema.describe('Tagged id of the new entry (always `kind: "custom"`).'),
        label: z.string().describe('Human-readable label for the new entry.'),
        geometryCount: z.number().describe('Number of geometries returned by the user code.'),
        sourceIds: z.array(geometriesIdSchema).describe(GEOMETRIES_SOURCE_IDS_DESC),
        operation: z.string().optional().describe('Operation label stored on the new entry.'),
        skipped: z.array(skippedSourceSchema).optional().describe(GEOMETRIES_SKIPPED_DESC),
        fitted: fittedReportSchema.optional().describe('Bounds the camera was fit to (when `fitOnMap` was set).'),
        shown: z.boolean().optional().describe('Whether the new entry was rendered on the map (when `show` was set).'),
    }),
    // Fit-only: code returned `fitOnMap` without geometries — camera moved, no entry written.
    z.object({ fitted: fittedReportSchema }),
    toolErrorSchema,
]);

const PROCESS_CODE_DOC =
    'Async JS over `geometries`. Return `PolygonFeature[]` (Polygon/MultiPolygon, stable `id` recommended; ' +
    'empty = empty result) OR `{ geometries?, fitOnMap? }` for code-and-zoom; `{ fitOnMap }` alone skips ' +
    `state.\n\n${GEOMETRIES_PROPS_DOC}\n\n${buildSandboxCodePrompt(['geometries', 'h3', 'turf'])}\n\n` +
    `${FIT_ON_MAP_DOC}\n\n` +
    'Turf v7: `union`/`intersect`/`difference` take a single `FeatureCollection` (NOT two features). ' +
    'Wrap inputs with `turf.featureCollection([...])`.\n\n' +
    'Each input feature is tagged with `properties._source: { kind, id }` reflecting the tagged id ' +
    'it was passed in under. Filter by that to pick a specific input role inside the sandbox — e.g. for ' +
    '"areas in Amsterdam not reachable from the hospitals", first call `locatePlace` to fetch Amsterdam\'s ' +
    'polygon and `findReachableAreas` for the hospitals, then pass BOTH ids to `geometriesEntryIDs` and ' +
    'select them in code via `_source`.\n\n' +
    'Examples:\n' +
    '- union: `return geometries.length ? [turf.union(turf.featureCollection(geometries))].filter(Boolean) : [];`\n' +
    '- buffer each by 200m: `return geometries.map((f) => ({ ...turf.buffer(f, 200, { units: "meters" }), id: `${f.id}-buf` }));`\n' +
    '- pairwise intersections: `const out = []; for (let i=0;i<geometries.length;i++) for (let j=i+1;j<geometries.length;j++) { const x = turf.intersect(turf.featureCollection([geometries[i], geometries[j]])); if (x) out.push({ ...x, id: `x-${i}-${j}` }); } return out;`\n' +
    '- inverse within a named region (pass region polygon AND the inner polygons; pick by `_source`): `const outer = geometries.filter(g => g.properties._source.kind === "place"); const inner = geometries.filter(g => g.properties._source.kind === "ranges"); const env = turf.union(turf.featureCollection(outer)); const u = turf.union(turf.featureCollection(inner)); const inv = (env && u) ? turf.difference(turf.featureCollection([env, u])) : env; return inv ? [{ ...inv, id: "inverse" }] : [];`\n' +
    '- inverse with bbox-envelope fallback (no containing region available): `const fc = turf.featureCollection(geometries); const [w,s,e,n] = turf.bbox(fc); const env = turf.bboxPolygon([w-0.05,s-0.05,e+0.05,n+0.05]); const u = turf.union(fc); const inv = u ? turf.difference(turf.featureCollection([env, u])) : env; return inv ? [{ ...inv, id: "inverse" }] : [];`\n' +
    '- h3 hex coverage: `const cells = new Set(); for (const f of geometries) for (const c of h3.polygonToCells(f.geometry.coordinates, 8)) cells.add(c); return [...cells].map((c) => turf.polygon([h3.cellToBoundary(c, true)], { cell: c, type: "h3-cell" }));`\n' +
    '- focus camera (no entry): `const u = geometries.length ? turf.union(turf.featureCollection(geometries)) : null; return { fitOnMap: u ? turf.bbox(u) : turf.bbox({type:"FeatureCollection",features:geometries}) };`\n' +
    '- write entry AND zoom: `const out = geometries.map((f) => ({ ...turf.buffer(f, 200, { units: "meters" }), id: `${f.id}-buf` })); return { geometries: out, fitOnMap: { bbox: turf.bbox({type:"FeatureCollection",features:out}), padding: 80 } };`\n\n' +
    `${GEOMETRIES_SCHEMA_DOC}`;

/** Tool schema for process-geometries. */
export const processGeometriesSchema = z.object({
    geometriesEntryIDs: geometriesEntryIDsSchema,
    code: z.string().describe(PROCESS_CODE_DOC),
    label: z.string().optional().describe('Short label for the new entry (default: "processed geometries (<N>)").'),
    operation: z
        .string()
        .optional()
        .describe(
            'Short operation label (`union`, `buffer`, `difference`, `h3-coverage`, …) stored as provenance. ' +
                'Defaults to `custom`.',
        ),
    entryId: placesEntryIdHintSchema,
    show: z
        .object({
            theme: z
                .enum(['filled', 'outline', 'inverted'])
                .optional()
                .describe('Visual theme. Default: "outline". Use "inverted" for difference/inverse results.'),
            mode: showModeSchema,
            hidePreviousEntries: hidePreviousEntriesSchema('custom-geometries'),
        })
        .optional()
        .describe(
            'Render the new custom-geometries entry on the map. ' +
                'For derived results that supersede their inputs (inverse, difference, union of isochrones, …), ' +
                'set `hidePreviousEntries: "all"` so the prior reachable / source polygons are cleared and only ' +
                'the new entry is visible. Omit `show` to write the entry without rendering.',
        ),
});

export const processGeometriesDescription =
    'Aggregate polygons (place footprints, isochrones, custom-entries) via JS — union, intersect, buffer, ' +
    'difference, h3 coverage, etc. — and/or fit the camera. Code ' +
    '`(geometries, h3, turf) => PolygonFeature[] | { geometries?, fitOnMap? }`. ' +
    'Returning `geometries` writes a NEW custom-geometries entry; `{ fitOnMap }` alone skips state. ' +
    'Each input feature is tagged with `properties._source: { kind, id }` so code can pick specific ' +
    'roles by source — e.g. for inverse/difference within a NAMED region, pass the region polygon ' +
    '(via locatePlace/discoverPlaces) AND the inner polygons in `geometriesEntryIDs`, then filter by ' +
    '`_source` in code. ' +
    'Set `show: { hidePreviousEntries: "all" }` for derived results that should replace their inputs ' +
    '(otherwise the new entry is stored but not rendered). Sources untouched.';

type ValidatedProcessResult = {
    geometries: PolygonFeature[];
    fitOnMap?: FitOnMapInput;
};

// Accepts either a bare `PolygonFeature[]` or `{ geometries?, fitOnMap? }`. Object form must set
// at least one; `fitOnMap` alone is a valid "focus camera, write nothing" result.
const validateProcessOutput = (analysis: unknown): ValidatedProcessResult | string => {
    if (Array.isArray(analysis)) {
        if (!isPolygonFeatureArray(analysis)) {
            for (let i = 0; i < analysis.length; i++) {
                if (!isPolygonFeature(analysis[i])) {
                    return `Process code returned an invalid feature at index ${i}: must be a GeoJSON Feature with a Polygon or MultiPolygon geometry.`;
                }
            }
        }
        return { geometries: analysis as PolygonFeature[] };
    }
    if (analysis && typeof analysis === 'object') {
        const v = analysis as { geometries?: unknown; fitOnMap?: unknown };
        const hasGeometries = v.geometries !== undefined;
        const hasFitOnMap = v.fitOnMap !== undefined;
        if (!hasGeometries && !hasFitOnMap) {
            return 'Process code returned an empty object — set at least one of `geometries` or `fitOnMap`.';
        }
        if (hasGeometries && !isPolygonFeatureArray(v.geometries)) {
            return '`geometries` must be a `PolygonFeature[]` (each a GeoJSON Feature with a Polygon or MultiPolygon geometry).';
        }
        if (hasFitOnMap && !isFitOnMapInput(v.fitOnMap)) {
            return '`fitOnMap` must be a `[W,S,E,N]` BBox tuple or `{ bbox: [W,S,E,N], padding?: number, animate?: boolean }`.';
        }
        return {
            geometries: hasGeometries ? (v.geometries as PolygonFeature[]) : [],
            ...(hasFitOnMap && { fitOnMap: v.fitOnMap as FitOnMapInput }),
        };
    }
    return 'Process code must return either a `PolygonFeature[]` or an object `{ geometries?: PolygonFeature[], fitOnMap?: BBox | { bbox, padding?, animate? } }`.';
};

export const executeProcessGeometries = async (
    params: z.infer<typeof processGeometriesSchema>,
    state: ToolState,
): Promise<z.infer<typeof processGeometriesOutputSchema>> => {
    const { geometriesEntryIDs, code, label, operation, entryId, show } = params;

    const collected = await collectInputGeometries(geometriesEntryIDs, state);
    if ('error' in collected) return { error: collected.error };
    const { geometries, skipped, contributingSourceIds } = collected.value;

    const sandboxResult = await runSandboxedFn(code, ['geometries', 'h3', 'turf'], [geometries, h3, turf], 'Process');
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateProcessOutput(sandboxResult.value);
    if (typeof validated === 'string') return { error: validated };

    // Fit-only: code returned `{ fitOnMap }` (or `{ geometries: [], fitOnMap }`) — move camera, skip entry.
    if (validated.geometries.length === 0 && validated.fitOnMap) {
        return { fitted: applyFitOnMap(state, validated.fitOnMap) };
    }

    const fallbackLabel = `processed geometries (${validated.geometries.length})`;
    const entryLabel = label ? `processed: ${label}` : fallbackLabel;
    // Range polygons carry different `properties` shapes than place footprints, but the
    // `customGeometries` slice stores them via the same `PolygonFeature<CommonPlaceProps>[]`
    // contract its display module expects — the cast is structurally safe (display reads
    // geometry, not properties) and avoids leaking generic-property variance to consumers.
    const newEntryId = state.customGeometries.addEntry(
        validated.geometries as PolygonFeature<CommonPlaceProps>[],
        { sourceIds: contributingSourceIds, ...(operation && { operation }) },
        entryLabel,
        entryId,
    );

    const fitted = validated.fitOnMap ? applyFitOnMap(state, validated.fitOnMap) : undefined;

    let shown = false;
    if (show) {
        await hidePreviousShownEntries(state.customGeometries, [newEntryId], show.hidePreviousEntries);
        await state.customGeometries.showEntry(newEntryId, show.theme ?? 'outline', show.mode ?? 'replace');
        shown = true;
    }

    const geometriesEntryIdOut: GeometriesId = { kind: 'custom', id: newEntryId };

    return {
        geometriesEntryId: geometriesEntryIdOut,
        label: entryLabel,
        geometryCount: validated.geometries.length,
        sourceIds: contributingSourceIds,
        ...(operation && { operation }),
        ...(skipped.length && { skipped }),
        ...(fitted && { fitted }),
        ...(shown && { shown }),
    };
};
