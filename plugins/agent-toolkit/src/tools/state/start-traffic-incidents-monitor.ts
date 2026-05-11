/**
 * @module agent-toolkit-tools
 */

import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const startTrafficIncidentsMonitorOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string(),
        alreadyRunning: z
            .boolean()
            .describe(
                'True when the entry already had a running monitor — start is idempotent. ' +
                    'When true, any new intervalMs / filter context in this call was IGNORED; ' +
                    'the monitor keeps running with whatever it was started with. ' +
                    'Call stopTrafficIncidentsMonitor first if you need different settings.',
            ),
    }),
    toolErrorSchema,
]);

export const startTrafficIncidentsMonitorSchema = z.object({
    incidentsEntryID: z.string().describe('Id of the incidents entry to monitor (returned by `getTrafficIncidents`).'),
    intervalMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Polling interval in milliseconds. Defaults to 60000 (60s).'),
});

export const startTrafficIncidentsMonitorDescription =
    "Start a background monitor for an existing incidents entry. Re-fetches the entry's bbox + filters every " +
    'interval (default 60s) and replaces its data; any registered analyses re-run on each tick. The first tick ' +
    'fires immediately, so this duplicates the most recent getTrafficIncidents fetch — only call it when the user ' +
    'wants the entry to stay current. ' +
    '\n\n' +
    'Idempotent on a running monitor: a second call is a no-op and returns alreadyRunning: true. A new intervalMs ' +
    'is NOT applied to a running monitor — stop first, then start again to change settings.';

export const executeStartTrafficIncidentsMonitor = async (
    params: z.infer<typeof startTrafficIncidentsMonitorSchema>,
    state: ToolState,
): Promise<z.infer<typeof startTrafficIncidentsMonitorOutputSchema>> => {
    const { incidentsEntryID, intervalMs } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return {
            error: `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.`,
        };
    }

    const alreadyRunning = state.trafficIncidents.isMonitored(incidentsEntryID);

    // Capture the entry's filters in the fetcher closure so every tick (not just the first)
    // re-issues the same category / time-validity filter the entry was loaded with.
    const { bbox, categoryFilter, timeValidityFilter } = entry.params;
    const filters = {
        ...(categoryFilter && { categoryFilter }),
        ...(timeValidityFilter && { timeValidityFilter }),
    };

    state.trafficIncidents.startMonitoring(
        incidentsEntryID,
        { bbox, capturedAt: entry.timestamp, label: entry.label },
        {
            fetchIncidents: async (b) => (await trafficIncidentDetails({ ...filters, bbox: b })).features,
        },
        intervalMs ? { intervalMs } : undefined,
    );

    return { incidentsEntryID, alreadyRunning };
};
