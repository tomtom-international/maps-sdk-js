import { z } from 'zod';
import type { FeatureFlags, ToolEntry, ToolEntryBuilder, ToolState } from '../../types';
import { summarizePlaces } from '../../utils';
import { buildPlacesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

export const recallPlacesSchema = z.object({
    id: z.string().optional().describe('Entry ID to retrieve (e.g. "places-3"). Omit to list all entries.'),
});

const analysisIndexSchema = z.object({
    name: z.string(),
    outputFormat: z.enum(['json', 'chart']),
    timestamp: z.number(),
    description: z.string().optional(),
});

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    featureCount: z.number().describe('Number of Place features stored in this entry.'),
    analyses: z
        .array(analysisIndexSchema)
        .optional()
        .describe('Analyses already attached to this entry via analysePlaces (name + output format).'),
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several entries render simultaneously; ' +
            '`single` enforces "at most one entry on the map" — switching to it auto-clears non-latest entries.',
    );

/** Build the flag-aware output schema for recall-places. */
export const buildRecallPlacesOutputSchema = (flags: FeatureFlags) => {
    const detailSchema = z.object({
        id: z.string(),
        label: z.string(),
        timestamp: z.number(),
        places: buildPlacesOutputSchema(flags),
    });
    return z.union([
        z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
        detailSchema.extend({ entryMode: entryModeSchema }),
        toolErrorSchema,
    ]);
};

/** Default-flag (`experimentalSearch: false`) output schema. */
export const recallPlacesOutputSchema = buildRecallPlacesOutputSchema({});

export const recallPlacesDescription =
    'List / inspect places entries already in session state (from discoverPlaces / locatePlace / processPlaces) ' +
    '— the same entries every `placesEntryIDs` parameter accepts. ALWAYS call this before referencing past ' +
    'places; never guess IDs. No args = index (id, label, timestamp, featureCount, analyses) + `entryMode`; ' +
    'pass `id` for full Place coordinates. No service call.';

/**
 * Build the recall-places executor for a given {@link FeatureFlags} bag.
 * Controls whether the place summaries include the experimental `areaId` /
 * `areaCountry` / `areaTags` fields.
 */
export const buildExecuteRecallPlaces =
    (flags: FeatureFlags) =>
    async (
        params: z.infer<typeof recallPlacesSchema>,
        state: ToolState,
    ): Promise<z.infer<ReturnType<typeof buildRecallPlacesOutputSchema>>> => {
        const { id } = params;
        const allEntries = state.places.entries;
        const entryMode = state.places.entryMode;

        if (!id) {
            const entries = [...allEntries]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(({ id, label, timestamp, places, _analysis }) => ({
                    id,
                    label,
                    timestamp,
                    featureCount: places.length,
                    ...(_analysis?.length && {
                        analyses: _analysis.map(({ name, outputFormat, timestamp, description }) => ({
                            name,
                            outputFormat,
                            timestamp,
                            ...(description && { description }),
                        })),
                    }),
                }));
            return { entries, entryMode };
        }

        const entry = allEntries.find((e) => e.id === id);
        if (!entry) {
            return { error: `No entry found with id "${id}"` };
        }

        const places = summarizePlaces(entry.places, flags);

        return {
            id: entry.id,
            label: entry.label,
            timestamp: entry.timestamp,
            places,
            entryMode,
        };
    };

/** Default-flag (`experimentalSearch: false`) executor. */
export const executeRecallPlaces = buildExecuteRecallPlaces({});

/**
 * Build a complete {@link ToolEntry} for `recallPlaces` for the given
 * {@link FeatureFlags}.
 */
export const buildRecallPlacesEntry = <S extends ToolState = ToolState>(
    flags: FeatureFlags,
    metadata: Omit<ToolEntry<S>, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>,
): ToolEntry<S> => ({
    ...metadata,
    description: recallPlacesDescription,
    inputSchema: recallPlacesSchema,
    outputSchema: buildRecallPlacesOutputSchema(flags),
    execute: buildExecuteRecallPlaces(flags) as ToolEntry<S>['execute'],
});

const recallPlacesMetadata = {
    classificationPrompt:
        'List/inspect places entries in state — pick valid IDs before any `placesEntryIDs` tool (processPlaces, analysePlaces, updatePlacesDisplay).',
    tags: ['place', 'location'],
    examples: ['recallPlaces()', 'recallPlaces({ id: "places-0" })'],
    examplePrompts: [
        'What places did I search for?',
        'List every places entry with its ID',
        'Which IDs can I pass to processPlaces or updatePlacesDisplay?',
        'Recall the bakeries I discovered earlier',
        'What is in entry places-2?',
    ],
    relatedTools: ['discoverPlaces', 'locatePlace', 'reverseGeocode', 'updatePlacesDisplay'],
    dependsOn: ['locatePlace', 'discoverPlaces'],
} satisfies Omit<ToolEntry, 'description' | 'inputSchema' | 'outputSchema' | 'execute'>;

/**
 * Builder for the recallPlaces default tool entry.
 */
export const recallPlacesBuilder: ToolEntryBuilder = (options) =>
    buildRecallPlacesEntry(options.featureFlags ?? {}, recallPlacesMetadata);
