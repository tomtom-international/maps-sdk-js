import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizePlaces } from '../../utils/summarize';
import { placesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

export const recallPlacesSchema = z.object({
    id: z.string().optional().describe('Entry ID to retrieve (e.g. "places-3"). Omit to list all entries.'),
});

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
});

const detailSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    places: placesOutputSchema,
});

export const recallPlacesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema) }),
    detailSchema,
    toolErrorSchema,
]);

export const recallPlacesDescription =
    'Retrieve places and search results from session history. ' +
    'ALWAYS use this when referencing places from earlier in the session — do not re-search by name. ' +
    'Returns entries with stable IDs accepted by showPlaces, and exact coordinates usable in setRouteLocations. ' +
    'Step 1: call with no parameters to list all entries and find the right ID. Do NOT guess IDs. ' +
    'Step 2: call with id to retrieve a specific entry with coordinates. ' +
    'Does not call any service.';

export const executeRecallPlaces = async (
    params: z.infer<typeof recallPlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallPlacesOutputSchema>> => {
    const { id } = params;

    if (!id) {
        const entries = [...state.places.entries]
            .reverse()
            .map(({ id, label, timestamp }) => ({ id, label, timestamp }));
        return { entries };
    }

    const entry = state.places.entries.find((e) => e.id === id);
    if (!entry) {
        return { error: `No entry found with id "${id}"` };
    }

    const places = summarizePlaces(entry.data);

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        places,
    };
};
