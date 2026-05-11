/**
 * @module agent-toolkit-tools
 */

import type { Routes } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { ToolState } from '../../types';
import {
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    buildAnalyseReturnPrompt,
    buildSandboxCodePrompt,
    findPlacesByEntry,
    PLACES_SCHEMA_DOC,
    placesEntryIDsSchema,
    ROUTES_SCHEMA_DOC,
    routesEntryIDsSchema,
    runSandboxedFn,
    validateAnalysisResult,
} from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the analyse-routes tool. */
export const analyseRoutesOutputSchema = z.union([
    z.object({
        routesEntryIDs: z.array(z.string()).describe('IDs of the source routes entries the analysis was attached to.'),
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
                    'when `json`, any JSON-serializable value; when `chart`, a Chart.js `ChartConfiguration`.',
            ),
    }),
    toolErrorSchema,
]);

/** Tool schema for analyse-routes. */
export const analyseRoutesSchema = z.object({
    routesEntryIDs: routesEntryIDsSchema({
        verb: 'analyse',
        extra: 'Multiple IDs are merged into a single `routes` input (features concatenated). The analysis is attached to EACH source entry under `_analysis` with the given name.',
    }),
    placesEntryIDs: placesEntryIDsSchema({
        verb: 'cross-reference',
        extra:
            'Optional. When set, those entries are injected as `placesByEntry: Record<entryId, Places>` so the code can correlate ' +
            'route geometry/sections with places (e.g. POIs near the route, places per country, hex co-occurrence).',
    }),
    name: z
        .string()
        .describe(
            'Unique name within the entry (e.g. "summary", "traffic-delay-by-country", "ev-stops-near-route"). Reusing a name replaces the previous analysis.',
        ),
    description: z.string().optional().describe('Optional short description of what the analysis computes.'),
    outputFormat: z.enum(['json', 'chart']).optional().describe(ANALYSE_OUTPUT_FORMAT_DESCRIPTION),
    code: z
        .string()
        .describe(
            'Async JS that aggregates the injected `routes` FeatureCollection (and `placesByEntry` when `placesEntryIDs` is set, else `undefined`) and returns the result.\n\n' +
                `${buildSandboxCodePrompt(['routes', 'placesByEntry', 'h3', 'turf'])}\n\n` +
                `${buildAnalyseReturnPrompt('totals, per-section breakdowns, hex bins, place counts within X m of the route', '`labels: sections.map(s => [s.name, \\`${s.km} km\\`, \\`+${s.delaySec}s delay\\`])`')}\n\n` +
                'For places-vs-route work: buffer the line with `turf.buffer(route, meters/1000, { units: "kilometers" })` and test with `turf.booleanPointInPolygon`, ' +
                'or compute `turf.pointToLineDistance(place, route, { units: "meters" })`. ' +
                'Iterate `Object.entries(placesByEntry)` to keep results grouped by entry.\n\n' +
                `${ROUTES_SCHEMA_DOC}\n\n` +
                `${PLACES_SCHEMA_DOC}\n\n`,
        ),
});

export const analyseRoutesDescription =
    'Aggregate routes entries via dynamic JS — totals, per-section breakdowns, traffic delays, charts; ' +
    'cross-references places entries when `placesEntryIDs` is set (POIs near route, hex co-occurrence). ' +
    'Code: `(routes, h3, turf, placesByEntry?) => result`; `outputFormat: "json"` (default) or `"chart"`. ' +
    'Result attached as `_analysis[name]` on each source routes entry. Read-only.';

export const executeAnalyseRoutes = async (
    params: z.infer<typeof analyseRoutesSchema>,
    state: ToolState,
): Promise<z.infer<typeof analyseRoutesOutputSchema>> => {
    const { routesEntryIDs, placesEntryIDs, name, description, code, outputFormat = 'json' } = params;

    const sourceEntries = routesEntryIDs?.length
        ? routesEntryIDs.map((id) => state.routing.entries.find((entry) => entry.id === id))
        : [state.routing.entries.at(-1)];

    for (let i = 0; i < sourceEntries.length; i++) {
        if (!sourceEntries[i]) {
            const requestedId = routesEntryIDs?.[i];
            return {
                error: requestedId
                    ? `No entry found with id "${requestedId}". Use recallRoutes to list available IDs.`
                    : 'No routes entries available to analyse. Run setRoute first.',
            };
        }
    }
    const resolvedEntries = sourceEntries as NonNullable<(typeof sourceEntries)[number]>[];

    const placesByEntryResult = findPlacesByEntry(placesEntryIDs, state);
    if ('error' in placesByEntryResult) return { error: placesByEntryResult.error };
    const placesByEntry = placesByEntryResult.value;

    const inputRoutes: Routes = {
        type: 'FeatureCollection',
        features: resolvedEntries.flatMap((entry) => entry.data.features),
    } as Routes;

    const sandboxResult = await runSandboxedFn(
        code,
        ['routes', 'h3', 'turf', 'placesByEntry'],
        [inputRoutes, h3, turf, placesByEntry],
        'Analysis',
    );
    if ('error' in sandboxResult) return { error: sandboxResult.error };

    const validated = validateAnalysisResult(sandboxResult.value, outputFormat);
    if ('error' in validated) return { error: validated.error };
    const analysis = validated.value;

    const timestamp = Date.now();
    for (const entry of resolvedEntries) {
        state.routing.addAnalysisToEntry(entry.id, {
            name,
            timestamp,
            ...(description && { description }),
            outputFormat,
            data: analysis,
        });
    }

    return {
        routesEntryIDs: resolvedEntries.map((entry) => entry.id),
        name,
        ...(description && { description }),
        outputFormat,
        analysis,
    };
};
