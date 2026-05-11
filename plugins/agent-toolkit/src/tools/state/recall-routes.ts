import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizeRoutes, summarizeWaypoint, waypointSummarySchema } from '../../utils';
import { costModelSchema, whenSchema } from '../services/set-route';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

export const recallRoutesSchema = z.object({
    id: z.string().optional().describe('Entry ID to retrieve (e.g. "routes-1"). Omit to list all entries.'),
});

const indexEntrySchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
});

const routeParamsSchema = z.object({
    maxAlternatives: z.number().optional(),
    costModel: costModelSchema.optional(),
    when: whenSchema.optional(),
});

const detailSchema = z.object({
    id: z.string(),
    label: z.string(),
    timestamp: z.number(),
    routes: routesOutputSchema,
    waypoints: z.array(
        z.object({
            position: z.array(z.number()).length(2).describe('[longitude, latitude]'),
        }),
    ),
    params: routeParamsSchema,
});

const entryModeSchema = z
    .enum(['single', 'multiple'])
    .describe(
        'Display policy: `multiple` (default) lets several routes render at once; ' +
            '`single` enforces "at most one route on the map" — switching to it auto-clears non-latest entries.',
    );

export const recallRoutesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema), entryMode: entryModeSchema }),
    detailSchema.extend({ entryMode: entryModeSchema }),
    toolErrorSchema,
]);

export const recallRoutesDescription =
    'List calculated routes from session history, or retrieve one by `id` (route details + params). ' +
    'IDs are stable and accepted by updateRoutesDisplay. Never guess IDs — list first. No service call.';

export const executeRecallRoutes = async (
    params: z.infer<typeof recallRoutesSchema>,
    state: ToolState,
): Promise<z.infer<typeof recallRoutesOutputSchema>> => {
    const { id } = params;
    const entryMode = state.routing.entryMode;

    if (!id) {
        const entries = [...state.routing.entries]
            .reverse()
            .map(({ id, label, timestamp }) => ({ id, label, timestamp }));
        return { entries, entryMode };
    }

    const entry = state.routing.entries.find((e) => e.id === id);
    if (!entry) {
        return { error: `No entry found with id "${id}"` };
    }

    const summarized = summarizeRoutes(entry.data);
    const waypoints = entry.waypoints
        .map((wp) => summarizeWaypoint(wp))
        .filter((wp): wp is z.infer<typeof waypointSummarySchema> => wp !== null)
        .map((wp) => ({ position: wp.position ?? [0, 0] }));

    return {
        id: entry.id,
        label: entry.label,
        timestamp: entry.timestamp,
        routes: summarized,
        waypoints,
        params: entry.params as z.infer<typeof routeParamsSchema>,
        entryMode,
    };
};
