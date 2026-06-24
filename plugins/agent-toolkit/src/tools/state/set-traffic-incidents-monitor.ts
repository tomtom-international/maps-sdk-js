/**
 * @module agent-toolkit-tools
 *
 * `setTrafficIncidentsMonitor` — one toggle that arms or disarms background polling on an existing
 * incidents entry. Merges the former start/stop pair: `enabled: true` starts the poll (re-fetch the
 * entry's bbox + filters every interval, replacing its data; registered analyses re-run each tick),
 * `enabled: false` stops it. `getTrafficIncidents` still auto-monitors a fresh shown fetch, so this is
 * only needed to (re)arm an entry loaded earlier / loaded with `monitor: false`, or to pause one.
 */

import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const setTrafficIncidentsMonitorOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string(),
        enabled: z.boolean().describe('The monitor is now polling (true) or stopped (false).'),
        alreadyInState: z
            .boolean()
            .describe('True when the monitor was already in the requested state — this call was a no-op.'),
    }),
    toolErrorSchema,
]);

export const setTrafficIncidentsMonitorSchema = z.object({
    incidentsEntryID: z.string().describe('Id of the incidents entry to monitor (returned by `getTrafficIncidents`).'),
    enabled: z
        .boolean()
        .describe(
            'true → start background polling (re-fetch + re-run registered analyses each tick); false → stop it. ' +
                'The entry keeps its last data either way.',
        ),
    intervalMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
            'Polling interval in milliseconds when enabling (default 60000). Ignored when disabling, and not ' +
                'applied to an already-running monitor — disable then re-enable to change it.',
        ),
});

export const setTrafficIncidentsMonitorDescription =
    'Start or stop the background monitor for an EXISTING incidents entry (`enabled: true` / `false`). When ' +
    "enabled, re-fetches the entry's bbox + filters every interval (default 60s) and replaces its data; the first " +
    'tick fires immediately, and any registered analyses re-run each tick. When disabled, polling stops and the ' +
    'entry stays in state with its last data (use removeEntry to drop it). ' +
    '\n\n' +
    'getTrafficIncidents already monitors a fresh shown fetch by default, so only enable here for an entry loaded ' +
    'on an EARLIER turn ("keep that area updated") or one loaded with monitor: false. Enabling is idempotent on a ' +
    'running monitor (no-op, alreadyInState: true); a new intervalMs is NOT applied to a running monitor — disable ' +
    'then enable to change it. Only a displayed entry can be monitored: a show:false load is a one-shot snapshot.';

export const executeSetTrafficIncidentsMonitor = async (
    params: z.infer<typeof setTrafficIncidentsMonitorSchema>,
    state: ToolState,
): Promise<z.infer<typeof setTrafficIncidentsMonitorOutputSchema>> => {
    const { incidentsEntryID, enabled, intervalMs } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return { error: `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.` };
    }

    if (!enabled) {
        const wasRunning = state.trafficIncidents.isMonitored(incidentsEntryID);
        state.trafficIncidents.stopMonitoring(incidentsEntryID);
        return { incidentsEntryID, enabled: false, alreadyInState: !wasRunning };
    }

    // Monitoring is only for the live, displayed area: a tick refreshes data and re-runs analyses but
    // repaints nothing for a hidden entry, so a monitored-but-invisible entry would silently poll forever
    // and break the text-and-map-match contract. A `show: false` load is a one-shot snapshot by design.
    if (!state.trafficIncidents.shownEntryIds.has(incidentsEntryID)) {
        return {
            error:
                `Entry "${incidentsEntryID}" isn't displayed on the map, so it can't be monitored. ` +
                'Monitoring keeps the live shown area current; a show:false load is a one-shot snapshot. ' +
                'Re-fetch the area with getTrafficIncidents (show: true, the default) and monitor that entry.',
        };
    }

    const alreadyRunning = state.trafficIncidents.isMonitored(incidentsEntryID);

    // Capture the entry's filters in the fetcher closure so every tick (not just the first) re-issues the
    // same category / time-validity filter the entry was loaded with.
    const { bbox, categoryFilter, timeValidityFilter } = entry.params;
    const filters = {
        ...(categoryFilter && { categoryFilter }),
        ...(timeValidityFilter && { timeValidityFilter }),
    };

    state.trafficIncidents.startMonitoring(
        incidentsEntryID,
        { bbox, capturedAt: entry.timestamp, label: entry.label },
        { fetchIncidents: async (b) => (await trafficIncidentDetails({ ...filters, bbox: b })).features },
        intervalMs ? { intervalMs } : undefined,
    );

    return { incidentsEntryID, enabled: true, alreadyInState: alreadyRunning };
};
