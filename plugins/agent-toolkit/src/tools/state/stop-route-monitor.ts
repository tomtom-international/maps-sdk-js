/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const stopRouteMonitorOutputSchema = z.union([
    z.object({
        routesEntryID: z.string(),
        wasRunning: z.boolean().describe('True when a monitor was actually stopped; false when it was already idle.'),
    }),
    toolErrorSchema,
]);

export const stopRouteMonitorSchema = z.object({
    routesEntryID: z.string().describe('Id of the routes entry whose monitor should stop.'),
});

export const stopRouteMonitorDescription =
    'Stop the background monitor for a route entry. The entry itself stays in state with its last calculated data ' +
    '— use removeEntry if you also want to drop it. No-op when no monitor is running for the entry.';

export const executeStopRouteMonitor = async (
    params: z.infer<typeof stopRouteMonitorSchema>,
    state: ToolState,
): Promise<z.infer<typeof stopRouteMonitorOutputSchema>> => {
    const { routesEntryID } = params;
    const entry = state.routing.entries.find((e) => e.id === routesEntryID);
    if (!entry) {
        return { error: `No routes entry with id "${routesEntryID}".` };
    }

    const wasRunning = state.routing.isMonitored(routesEntryID);
    state.routing.stopMonitoring(routesEntryID);

    return { routesEntryID, wasRunning };
};
