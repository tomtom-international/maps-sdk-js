/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { type GeometriesId, geometriesIdSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

export const recallGeometriesSchema = z.object({
    id: geometriesIdSchema
        .optional()
        .describe(
            'Tagged id to inspect in detail (e.g. `{ kind: "places", id: "ev-stations-oost" }`, ' +
                '`{ kind: "ranges", id: "ranges-0" }`, `{ kind: "custom", id: "bakery-candidates-gap-oost" }`). ' +
                'Omit to list every available id across all slices.',
        ),
});

const analysisIndexSchema = z.object({
    name: z.string(),
    outputFormat: z.enum(['json', 'chart']),
    timestamp: z.number(),
    description: z.string().optional(),
});

const refSchema = z.object({
    id: geometriesIdSchema.describe('Tagged id of this entry.'),
    label: z.string(),
    timestamp: z.number(),
    featureCount: z.number(),
    operation: z.string().optional().describe('Operation label (custom-geometries entries only).'),
    sourceIds: z
        .array(geometriesIdSchema)
        .optional()
        .describe('Provenance: tagged ids of inputs that fed the producing op (custom only).'),
    analyses: z
        .array(analysisIndexSchema)
        .optional()
        .describe('Analyses already attached to this entry (places and custom only).'),
});

const detailSchema = refSchema.extend({
    /**
     * GeoJSON-like structure: `{ type: 'FeatureCollection', features: PolygonFeature[] }`.
     * Schema kept loose because the toolkit serialises features verbatim.
     */
    features: z.unknown().describe("GeoJSON FeatureCollection of the entry's polygon features."),
});

export const recallGeometriesOutputSchema = z.union([
    z.object({ entries: z.array(refSchema) }),
    detailSchema,
    toolErrorSchema,
]);

export const recallGeometriesDescription =
    'List or inspect every polygon source in session state — place footprints (cached on places ' +
    'entries via `withGeometries: true`), reachable-area isochrones, and custom-geometries entries ' +
    'produced by `processGeometries`. ALWAYS call this before passing ids to `processGeometries` or ' +
    '`analyseGeometries`; never guess. ' +
    'No args = index across all three slices; pass `id` to retrieve features and provenance for one entry. ' +
    'No service call.';

const summariseAnalyses = (
    analyses: { name: string; outputFormat: 'json' | 'chart'; timestamp: number; description?: string }[] | undefined,
) =>
    analyses?.length
        ? analyses.map(({ name, outputFormat, timestamp, description }) => ({
              name,
              outputFormat,
              timestamp,
              ...(description && { description }),
          }))
        : undefined;

const indexEntries = (state: ToolState): z.infer<typeof refSchema>[] => {
    const refs: z.infer<typeof refSchema>[] = [];

    for (const entry of state.places.entries) {
        if (!entry.geometries?.length) continue;
        const analyses = summariseAnalyses(entry._analysis);
        refs.push({
            id: { kind: 'places', id: entry.id },
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.geometries.length,
            ...(analyses && { analyses }),
        });
    }

    for (const entry of state.ranges.entries) {
        const featureCount = entry.ranges.reduce((acc, r) => acc + (r.polygon?.features.length ?? 0), 0);
        if (featureCount === 0) continue;
        refs.push({
            id: { kind: 'ranges', id: entry.id },
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount,
        });
    }

    for (const entry of state.customGeometries.entries) {
        const analyses = summariseAnalyses(entry._analysis);
        refs.push({
            id: { kind: 'custom', id: entry.id },
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.features.length,
            ...(entry.provenance.operation && { operation: entry.provenance.operation }),
            ...(entry.provenance.sourceIds.length && { sourceIds: [...entry.provenance.sourceIds] }),
            ...(analyses && { analyses }),
        });
    }

    return refs.sort((a, b) => b.timestamp - a.timestamp);
};

const detailFor = (id: GeometriesId, state: ToolState): z.infer<typeof detailSchema> | { error: string } => {
    if (id.kind === 'places') {
        const entry = state.places.entries.find((e) => e.id === id.id);
        if (!entry) return { error: `No places entry with id "${id.id}"` };
        if (!entry.geometries?.length) {
            return {
                error: `Places entry "${id.id}" has no cached footprints. Call discoverPlaces / locatePlace with \`withGeometries: true\` first.`,
            };
        }
        return {
            id,
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.geometries.length,
            features: { type: 'FeatureCollection', features: entry.geometries },
            ...(summariseAnalyses(entry._analysis) && { analyses: summariseAnalyses(entry._analysis) }),
        };
    }
    if (id.kind === 'ranges') {
        const entry = state.ranges.entries.find((e) => e.id === id.id);
        if (!entry) return { error: `No ranges entry with id "${id.id}"` };
        const features = entry.ranges.flatMap((r) => r.polygon?.features ?? []);
        if (features.length === 0) return { error: `Ranges entry "${id.id}" has no polygons.` };
        return {
            id,
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: features.length,
            features: { type: 'FeatureCollection', features },
        };
    }
    if (id.kind === 'custom') {
        const entry = state.customGeometries.findById(id.id);
        if (!entry) return { error: `No custom-geometries entry with id "${id.id}"` };
        return {
            id,
            label: entry.label,
            timestamp: entry.timestamp,
            featureCount: entry.features.length,
            features: { type: 'FeatureCollection', features: entry.features },
            ...(entry.provenance.operation && { operation: entry.provenance.operation }),
            ...(entry.provenance.sourceIds.length && { sourceIds: [...entry.provenance.sourceIds] }),
            ...(summariseAnalyses(entry._analysis) && { analyses: summariseAnalyses(entry._analysis) }),
        };
    }
    return {
        error: '`{ kind: "place" }` is not a recallable detail target. Pass a places-entry id (`{ kind: "places", id }`) or use `recallPlaces` to inspect a single place.',
    };
};

export const executeRecallGeometries = async (
    params: z.infer<typeof recallGeometriesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallGeometriesOutputSchema>> => {
    const { id } = params;
    if (!id) return { entries: indexEntries(state) };
    return detailFor(id, state);
};
