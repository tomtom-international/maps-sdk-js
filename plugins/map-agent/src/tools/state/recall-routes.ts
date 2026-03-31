import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizeRoutes, summarizeWaypoint, waypointSummarySchema } from '../../utils/summarize';
import { costModelSchema, whenSchema } from '../services/set-route-parameters';
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

export const recallRoutesOutputSchema = z.union([
    z.object({ entries: z.array(indexEntrySchema) }),
    detailSchema,
    toolErrorSchema,
]);

export const recallRoutesDescription =
    'Retrieve calculated routes from session history. ' +
    'ALWAYS use this when referencing routes from earlier in the session. ' +
    'Entries have stable IDs that showRoute accepts. ' +
    'Step 1: call with no parameters to list all entries and find the right ID. Do NOT guess IDs. ' +
    'Step 2: call with id to retrieve a specific entry with route details and params. ' +
    'Does not call any service.';

export function createRecallRoutesTool(state: ToolState): Tool {
    return tool({
        description: recallRoutesDescription,
        inputSchema: recallRoutesSchema,
        outputSchema: recallRoutesOutputSchema,
        execute: async (params): Promise<z.infer<typeof recallRoutesOutputSchema>> => {
            const { id } = params;

            if (!id) {
                const entries = [...state.routing.entries]
                    .reverse()
                    .map(({ id, label, timestamp }) => ({ id, label, timestamp }));
                return { entries };
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
            };
        },
    });
}
