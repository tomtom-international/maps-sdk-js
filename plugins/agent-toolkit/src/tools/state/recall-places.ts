import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizePlaces } from '../../utils';
import { placesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

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

const detailSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    places: placesOutputSchema,
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several entries render simultaneously; ' +
            '`single` enforces "at most one entry on the map" — switching to it auto-clears non-latest entries.',
    );

export const recallPlacesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
    detailSchema.extend({ entryMode: entryModeSchema }),
    toolErrorSchema,
]);

export const recallPlacesDescription =
    'List / inspect places entries already in session state (from discoverPlaces / locatePlace / processPlaces) ' +
    '— the same entries every `placesEntryIDs` parameter accepts. ALWAYS call this before referencing past ' +
    'places; never guess IDs. No args = index (id, label, timestamp, featureCount, analyses) + `entryMode`; ' +
    'pass `id` for full Place coordinates. No service call.';

export const executeRecallPlaces = async (
    params: z.infer<typeof recallPlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallPlacesOutputSchema>> => {
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

    const places = summarizePlaces(entry.places);

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        places,
        entryMode,
    };
};
