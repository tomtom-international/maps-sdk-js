/**
 * @module agent-toolkit-tools
 */

import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    buildAnalyseReturnPrompt,
    buildSandboxCodePrompt,
    collectInputGeometries,
    GEOMETRIES_PROPS_DOC,
    GEOMETRIES_SCHEMA_DOC,
    GEOMETRIES_SKIPPED_DESC,
    GEOMETRIES_SOURCE_IDS_DESC,
    type GeometriesId,
    geometriesEntryIDsSchema,
    geometriesIdSchema,
    runSandboxedFn,
    skippedSourceSchema,
    validateAnalysisResult,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the analyse-geometries tool. */
export const analyseGeometriesOutputSchema = z.union([
    z.object({
        affectedEntries: z
            .array(z.object({ id: geometriesIdSchema.describe('Tagged id of the affected entry.') }))
            .describe(
                'Entries the analysis was attached to: every contributing places entry plus every contributing ' +
                    'custom-geometries entry. Ranges entries feed the aggregation but do not carry analyses.',
            ),
        sourceIds: z.array(geometriesIdSchema).describe(GEOMETRIES_SOURCE_IDS_DESC),
        name: z.string().describe('Analysis name (unique within each affected entry).'),
        description: z.string().optional(),
        outputFormat: z
            .enum(['json', 'chart'])
            .describe('`json` = plain object for text rendering; `chart` = Chart.js `ChartConfiguration`.'),
        analysis: z
            .unknown()
            .describe('Aggregation result. JSON-serializable when `json`; Chart.js config when `chart`.'),
        skipped: z.array(skippedSourceSchema).optional().describe(GEOMETRIES_SKIPPED_DESC),
    }),
    toolErrorSchema,
]);

const ANALYSE_CODE_DOC =
    `Async JS that aggregates the injected \`geometries\` array and returns the result. ${GEOMETRIES_PROPS_DOC}\n\n` +
    `${buildSandboxCodePrompt(['geometries', 'h3', 'turf'])}\n\n` +
    `${buildAnalyseReturnPrompt('totals, per-feature breakdowns, hex bin counts, bboxes')}\n\n` +
    'Examples:\n' +
    '- total + average area: `const areas = geometries.map(turf.area); return { totalKm2: turf.round(areas.reduce((a,b)=>a+b,0)/1e6, 2), avgKm2: turf.round((areas.reduce((a,b)=>a+b,0)/areas.length)/1e6, 2), perFeature: areas.map((a,i) => ({ id: geometries[i].id, km2: turf.round(a/1e6, 2) })) };`\n' +
    '- combined bbox: `return { bbox: turf.bbox({ type: "FeatureCollection", features: geometries }) };`\n' +
    '- h3 coverage at res 8: `const cells = new Set(); for (const f of geometries) for (const c of h3.polygonToCells(f.geometry.coordinates, 8)) cells.add(c); return { resolution: 8, cellCount: cells.size };`\n' +
    '- areas as bar chart: `return { type: "bar", data: { labels: geometries.map(f => f.id), datasets: [{ label: "km²", data: geometries.map(f => +(turf.area(f)/1e6).toFixed(2)) }] } };`\n\n' +
    `${GEOMETRIES_SCHEMA_DOC}`;

/** Tool schema for analyse-geometries. */
export const analyseGeometriesSchema = z.object({
    geometriesEntryIDs: geometriesEntryIDsSchema,
    name: z
        .string()
        .describe(
            'Unique name within each affected entry (e.g. "total-area", "bbox-extent", "h3-coverage"). ' +
                'Reusing a name replaces the previous analysis on each entry.',
        ),
    description: z.string().optional().describe('Optional short description of what the analysis computes.'),
    outputFormat: z.enum(['json', 'chart']).optional().describe(ANALYSE_OUTPUT_FORMAT_DESCRIPTION),
    code: z.string().describe(ANALYSE_CODE_DOC),
});

export const analyseGeometriesDescription =
    'Aggregate polygons (place footprints, isochrones, custom-entries) via JS — areas, perimeters, hex ' +
    'coverage, bboxes, charts. Code `(geometries, h3, turf) => result`. Result attached as `_analysis[name]` ' +
    'on every contributing places/custom entry (ranges entries do not carry analyses). Read-only.';

export const executeAnalyseGeometries = async (
    params: z.infer<typeof analyseGeometriesSchema>,
    state: ToolState,
): Promise<z.infer<typeof analyseGeometriesOutputSchema>> => {
    const { geometriesEntryIDs, name, description, code, outputFormat = 'json' } = params;

    const collected = await collectInputGeometries(geometriesEntryIDs, state);
    if ('error' in collected) return { error: collected.error };
    const { geometries, affectedEntries, skipped, contributingSourceIds } = collected.value;

    const sandboxResult = await runSandboxedFn(code, ['geometries', 'h3', 'turf'], [geometries, h3, turf], 'Analysis');
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateAnalysisResult(sandboxResult.value, outputFormat);
    if ('error' in validated) return { error: validated.error };
    const analysis = validated.value;

    const timestamp = Date.now();
    for (const entry of affectedEntries) {
        const slice = entry.kind === 'places' ? state.places : state.customGeometries;
        slice.addAnalysisToEntry(entry.id, {
            name,
            timestamp,
            ...(description && { description }),
            outputFormat,
            data: analysis,
        });
    }

    return {
        affectedEntries: affectedEntries.map((e): { id: GeometriesId } => ({ id: { kind: e.kind, id: e.id } })),
        sourceIds: contributingSourceIds,
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
        ...(skipped.length && { skipped }),
    };
};
