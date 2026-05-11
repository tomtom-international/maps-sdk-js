/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

export const focusIncidentsOutputSchema = z.union([
    z.object({
        incidentsEntryID: z.string().describe('The entry the focus was applied to.'),
        focusedCount: z.number().describe('How many of the requested ids ended up in the focus subset.'),
        droppedIds: z
            .array(z.string())
            .describe('Ids that were not present on the entry and were dropped from the focus.'),
        reason: z.string().optional().describe('Echo of the focus reason for downstream display.'),
    }),
    toolErrorSchema,
]);

export const focusIncidentsSchema = z.object({
    incidentsEntryID: z
        .string()
        .describe(
            'Id of the incidents entry to focus on (from `getTrafficIncidents` or any registered analysis source).',
        ),
    incidentIds: z
        .array(z.string())
        .min(1)
        .describe('Ids of incidents within the entry to highlight. Unknown ids are dropped, not errored.'),
    reason: z
        .string()
        .optional()
        .describe('Short label shown in the UI FocusChip — what this subset represents (e.g. "top 3 by delay").'),
});

export const focusIncidentsDescription =
    'Highlight a subset of incidents on an existing entry. Drives the dim/highlight on the map ' +
    'and the FocusChip in the UI. Compose with `analyseIncidents` to compute the ids first ' +
    '(e.g. top-N by delay, members of a cluster). Unknown ids are dropped silently and ' +
    'returned in `droppedIds`. Errors only when the entry is unknown or NONE of the ids resolve.';

export const executeFocusIncidents = async (
    params: z.infer<typeof focusIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof focusIncidentsOutputSchema>> => {
    const { incidentsEntryID, incidentIds, reason } = params;
    const entry = state.trafficIncidents.entries.find((e) => e.id === incidentsEntryID);
    if (!entry) {
        return {
            error: `No incidents entry with id "${incidentsEntryID}". Call getTrafficIncidents first.`,
        };
    }
    const result = state.trafficIncidents.setFocus(incidentsEntryID, incidentIds, reason);
    if (result.focusedCount === 0) {
        return {
            error:
                `None of the ${incidentIds.length} requested ids exist on entry "${incidentsEntryID}". ` +
                'The snapshot may have rolled — call getTrafficIncidents and recompute the ids before retrying.',
        };
    }
    return {
        incidentsEntryID,
        focusedCount: result.focusedCount,
        droppedIds: result.droppedIds,
        ...(reason && { reason }),
    };
};
