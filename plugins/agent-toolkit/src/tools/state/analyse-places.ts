/**
 * @module agent-toolkit-tools
 */

import type { Places } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    buildAnalyseReturnPrompt,
    buildSandboxCodePrompt,
    PLACES_SCHEMA_DOC,
    placesEntryIDsSchema,
    runSandboxedFn,
    validateAnalysisResult,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the analyse-places tool. */
export const analysePlacesOutputSchema = z.union([
    z.object({
        placesEntryIDs: z.array(z.string()).describe('IDs of the source places entries the analysis was attached to.'),
        name: z.string().describe('Unique name of the analysis within the entry.'),
        description: z.string().optional(),
        outputFormat: z
            .enum(['json', 'chart'])
            .describe(
                'How the consumer should render `analysis`: `json` = plain object to display as text; ' +
                    '`chart` = Chart.js `ChartConfiguration` to feed directly into `new Chart(ctx, analysis)` in the chat message UI.',
            ),
        analysis: z
            .unknown()
            .describe(
                'The aggregation result. Shape depends on `outputFormat`: ' +
                    'when `json`, any JSON-serializable value; when `chart`, a Chart.js `ChartConfiguration` ({ type, data, options? }).',
            ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for analyse-places.
 */
export const analysePlacesSchema = z.object({
    placesEntryIDs: placesEntryIDsSchema({
        verb: 'analyse',
        extra: 'Multiple IDs are merged into a single `places` input. The analysis is attached to EACH source entry under `_analysis` with the given name.',
    }),
    name: z
        .string()
        .describe(
            'Unique name within the entry (e.g. "by-category", "hex-density-8"). Reusing a name replaces the previous analysis.',
        ),
    description: z.string().optional().describe('Optional short description of what the analysis computes.'),
    outputFormat: z.enum(['json', 'chart']).optional().describe(ANALYSE_OUTPUT_FORMAT_DESCRIPTION),
    code: z
        .string()
        .describe(
            'Async JS that aggregates the injected `places` FeatureCollection and returns the result. ' +
                '`places` is the merged set of every entry in `placesEntryIDs`; `placesByEntry[entryId]` exposes ' +
                'each one separately for per-entry totals or set ops — list every needed id in `placesEntryIDs` ' +
                'rather than trying to call `recallPlaces` (sandbox cannot call other tools).\n\n' +
                `${buildSandboxCodePrompt(['places', 'placesByEntry', 'h3', 'turf'])}\n\n` +
                `${buildAnalyseReturnPrompt('counts, groupings, hex bins, centroids, bboxes', '`labels: hexIds.map(h => [\\`Hex ${h}\\`, \\`${counts[h]} items\\`, ...names[h].slice(0, 5)])`')}\n\n` +
                `${PLACES_SCHEMA_DOC}\n\n`,
        ),
});

export const analysePlacesDescription =
    'Aggregate existing places entries via dynamic JS: counts, groupings, densities, summaries, charts. ' +
    'Code: `(places, h3, turf) => result`; `outputFormat: "json"` (default, text) or `"chart"` (Chart.js config). ' +
    'Result is returned and attached as `_analysis[name]` on each source entry. Does NOT create a new entry or touch the map (use processPlaces for that).';

export const executeAnalysePlaces = async (
    params: z.infer<typeof analysePlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof analysePlacesOutputSchema>> => {
    const { placesEntryIDs, name, description, code, outputFormat = 'json' } = params;

    const sourceEntries = placesEntryIDs?.length
        ? placesEntryIDs.map((id) => state.places.entries.find((entry) => entry.id === id))
        : [state.places.entries.at(-1)];

    for (let i = 0; i < sourceEntries.length; i++) {
        if (!sourceEntries[i]) {
            const requestedId = placesEntryIDs?.[i];
            return {
                error: requestedId
                    ? `No entry found with id "${requestedId}". Use recallPlaces to list available IDs.`
                    : 'No places entries available to analyse. Run discoverPlaces or processPlaces first.',
            };
        }
    }
    const resolvedEntries = sourceEntries as NonNullable<(typeof sourceEntries)[number]>[];

    const inputPlaces: Places = {
        type: 'FeatureCollection',
        features: resolvedEntries.flatMap((entry) => entry.places),
    } as Places;

    // Per-entry view so per-entry totals and set ops between entries don't
    // require leaving the sandbox to call `recallPlaces`. Mirrors the same
    // shape `process-places` exposes.
    const placesByEntry: Record<string, Places> = Object.fromEntries(
        resolvedEntries.map((entry) => [entry.id, { type: 'FeatureCollection', features: entry.places } as Places]),
    );

    const sandboxResult = await runSandboxedFn(
        code,
        ['places', 'placesByEntry', 'h3', 'turf'],
        [inputPlaces, placesByEntry, h3, turf],
        'Analysis',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateAnalysisResult(sandboxResult.value, outputFormat);
    if ('error' in validated) return { error: validated.error };
    const analysis = validated.value;

    const timestamp = Date.now();
    for (const entry of resolvedEntries) {
        state.places.addAnalysisToEntry(entry.id, {
            name,
            timestamp,
            ...(description && { description }),
            outputFormat,
            data: analysis,
        });
    }

    return {
        placesEntryIDs: resolvedEntries.map((entry) => entry.id),
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
    };
};
