/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const stopTrafficIncidentsMonitorOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string(),
        wasRunning: z.boolean().describe('True when a monitor was actually stopped; false when it was already idle.'),
    }),
    toolErrorSchema,
]);

export const stopTrafficIncidentsMonitorSchema = z.object({
    incidentsEntryID: z.string().describe('Id of the incidents entry whose monitor should stop.'),
});

export const stopTrafficIncidentsMonitorDescription =
    'Stop the background monitor for an incidents entry. The entry itself stays in state with its last data — ' +
    'use removeEntry if you also want to drop the entry. No-op when no monitor is running for the entry.';

export const executeStopTrafficIncidentsMonitor = async (
    params: z.infer<typeof stopTrafficIncidentsMonitorSchema>,
    state: ToolState,
): Promise<z.infer<typeof stopTrafficIncidentsMonitorOutputSchema>> => {
    const { incidentsEntryID } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return {
            error: `No incidents entry with id "${incidentsEntryID}".`,
        };
    }

    const wasRunning = state.trafficIncidents.isMonitored(incidentsEntryID);
    state.trafficIncidents.stopMonitoring(incidentsEntryID);

    return { incidentsEntryID, wasRunning };
};
