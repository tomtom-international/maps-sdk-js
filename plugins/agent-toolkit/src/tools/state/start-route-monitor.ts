/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { buildRouteRecalc } from '../services/set-route';
import { toolErrorSchema } from '../shared-output-schemas';

export const startRouteMonitorOutputSchema = z.union([
    z.object({
        routesEntryID: z.string(),
        alreadyRunning: z
            .boolean()
            .describe(
                'True when the entry already had a running monitor — start is idempotent. When true any new ' +
                    'intervalMs in this call was IGNORED; stop first, then start again to change the interval.',
            ),
    }),
    toolErrorSchema,
]);

export const startRouteMonitorSchema = z.object({
    routesEntryID: z.string().describe('Id of the routes entry to monitor (the `entryId` returned by `setRoute`).'),
    intervalMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Recalculation interval in milliseconds. Defaults to 60000 (60s).'),
});

export const startRouteMonitorDescription =
    'Start a background monitor on an EXISTING route entry: recalculates the SAME route (same waypoints + ' +
    'parameters) every interval (default 60s) and replaces its data in place, so the route stays current with ' +
    'live traffic. The first recalculation fires immediately. ' +
    '\n\n' +
    'Pairs with a route calculated as `traffic: "historical"` + `maxAlternatives: 1-2`: historical input keeps the ' +
    'typical route PATHS stable across ticks (live input would keep re-routing to dodge current traffic), while ' +
    'each recalculation refreshes the live-traffic delays carried on those paths. ' +
    '\n\n' +
    'Idempotent on a running monitor: a second call is a no-op returning alreadyRunning: true. A new intervalMs is ' +
    'NOT applied to a running monitor — stop first, then start again. Listen to the routing `entries-change` / ' +
    '`monitor-tick` events to react to each refresh.';

export const executeStartRouteMonitor = async (
    params: z.infer<typeof startRouteMonitorSchema>,
    state: ToolState,
): Promise<z.infer<typeof startRouteMonitorOutputSchema>> => {
    const { routesEntryID, intervalMs } = params;
    const entry = state.routing.entries.find((e) => e.id === routesEntryID);
    if (!entry) {
        return { error: `No routes entry with id "${routesEntryID}". Calculate a route first via setRoute.` };
    }

    const alreadyRunning = state.routing.isMonitored(routesEntryID);

    // Capture the entry's waypoints + params in the recalc closure so every tick re-runs the SAME
    // route with the same cost model / traffic mode it was calculated with — only the live-traffic
    // delays differ tick to tick.
    const { waypoints, params: routeParams } = entry;
    state.routing.startMonitoring(
        routesEntryID,
        { recalculate: buildRouteRecalc(waypoints, routeParams) },
        intervalMs ? { intervalMs } : undefined,
    );

    return { routesEntryID, alreadyRunning };
};
