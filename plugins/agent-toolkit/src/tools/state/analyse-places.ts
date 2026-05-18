/**
 * @module agent-toolkit-tools
 */

import type { Places } from '@tomtom-org/maps-sdk/core';
import * as turf from '@turf/turf';
import * as h3 from 'h3-js';
import { z } from 'zod';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolState } from '../../types';
import {
    ANALYSE_OUTPUT_FORMAT_DESCRIPTION,
    buildAnalyseReturnPrompt,
    buildPlacesSchemaDoc,
    buildSandboxCodePrompt,
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
 * Build the flag-aware tool schema for analyse-places.
 */
export const buildAnalysePlacesSchema = (flags: FeatureFlags) =>
    z.object({
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
                    `${buildPlacesSchemaDoc(flags)}\n\n`,
            ),
    });

/** Default-flag (`experimentalSearch: false`) tool schema. */
export const analysePlacesSchema = buildAnalysePlacesSchema({});

export const analysePlacesDescription =
    'Aggregate existing places entries via dynamic JS: counts, groupings, densities, summaries, charts. ' +
    'Code: `(places, h3, turf) => result`; `outputFormat: "json"` (default, text) or `"chart"` (Chart.js config). ' +
    'Result is returned and attached as `_analysis[name]` on each source entry. Does NOT create a new entry or touch the map (use processPlaces for that).';

export const executeAnalysePlaces = async (
    params: z.infer<ReturnType<typeof buildAnalysePlacesSchema>>,
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

/**
 * Build a complete {@link ToolEntry} for `analysePlaces` for the given
 * {@link FeatureFlags}. Only the schema doc embedded in the `code` field
 * description varies between flag sets — the executor is shared because
 * analyse-places does not echo place summaries in its output.
 */
export const buildAnalysePlacesEntry = <S extends ToolState = ToolState>(
    flags: FeatureFlags,
    metadata: Omit<ToolEntry<S>, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>,
): ToolEntry<S> => ({
    ...metadata,
    description: analysePlacesDescription,
    inputSchema: buildAnalysePlacesSchema(flags),
    outputSchema: analysePlacesOutputSchema,
    execute: executeAnalysePlaces as ToolEntry<S>['execute'],
});

// Static metadata for the analysePlaces tool — registry binds this to the schema/executor.
const analysePlacesMetadata = {
    classificationPrompt:
        'Aggregate / summarise / chart existing places via dynamic JS (h3, turf available). `outputFormat`: `json` (text) or `chart` (Chart.js).',
    tags: ['place', 'location', 'utilities'],
    examples: [
        'analysePlaces({ placesEntryIDs: ["places-2"], name: "by-category", code: "const counts = {}; for (const p of places.features) for (const c of (p.properties.poi?.categories ?? [])) counts[c] = (counts[c] ?? 0) + 1; return { total: places.features.length, byCategory: counts };" })',
        'analysePlaces({ placesEntryIDs: ["places-1"], name: "hex-density-8", description: "h3 resolution 8 density", code: "const bins = {}; for (const p of places.features) { const [lng,lat] = p.geometry.coordinates; const cell = h3.latLngToCell(lat, lng, 8); bins[cell] = (bins[cell] ?? 0) + 1; } return { resolution: 8, bins };" })',
        'analysePlaces({ placesEntryIDs: ["places-0", "places-1"], name: "extent", code: "return { bbox: turf.bbox(places), centroid: turf.centroid(places).geometry.coordinates };" })',
        'analysePlaces({ name: "top-categories-bar", outputFormat: "chart", code: "const counts = {}; for (const p of places.features) for (const c of (p.properties.poi?.categories ?? [])) counts[c] = (counts[c] ?? 0) + 1; const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10); return { type: \'bar\', data: { labels: entries.map(e => e[0]), datasets: [{ label: \'Places\', data: entries.map(e => e[1]) }] }, options: { plugins: { title: { display: true, text: \'Top categories\' } } } };" })',
        'analysePlaces({ name: "brand-share", outputFormat: "chart", code: "const counts = {}; for (const p of places.features) { const n = p.properties.poi?.brands?.[0]?.name ?? \'other\'; counts[n] = (counts[n] ?? 0) + 1; } return { type: \'doughnut\', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts) }] } };" })',
    ],
    examplePrompts: [
        'How many of each POI category are in these results?',
        'h3 hex density of these places at resolution 8',
        'Bounding box and centroid of these places',
        'Bar chart of the top POI categories',
        'Pie chart of the brand distribution',
        'Which municipality has the most of these places?',
    ],
    relatedTools: ['discoverPlaces', 'recallPlaces', 'processPlaces'],
    dependsOn: ['discoverPlaces', 'recallPlaces'],
} satisfies Omit<ToolEntry, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>;

/**
 * Builder for the analysePlaces default tool entry. Reads
 * {@link FeatureFlags} from the build options so the embedded Place schema
 * doc stays aligned with whatever the LLM sees from other tools.
 */
export const analysePlacesBuilder: ToolEntryBuilder = (options) =>
    buildAnalysePlacesEntry(options.featureFlags ?? {}, analysePlacesMetadata);
