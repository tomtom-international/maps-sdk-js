/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizeWaypoint, waypointSummarySchema } from '../../utils/summarize';

export const getCurrentWaypointsSchema = z.object({
    slotIndex: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Exact waypoint slot to retrieve. Use when you need one known origin/stop/destination slot.'),
    includeEmptySlots: z
        .boolean()
        .optional()
        .describe('Include unfilled slots in the result set. Defaults to false to avoid null-heavy responses.'),
    offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Pagination offset within the filtered slot list. Ignored when slotIndex is provided.'),
    limit: z
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe('Maximum slots to return. Defaults to 5. Ignored when slotIndex is provided.'),
});

export const getCurrentWaypointsOutputSchema = z.object({
    totalSlots: z.number().describe('Total waypoint slots currently staged'),
    filledSlots: z.number().describe('Number of staged slots that already contain coordinates'),
    matchedCount: z.number().describe('Total slots matching the request before pagination'),
    returnedCount: z.number().describe('Number of slots returned in this page'),
    offset: z.number().describe('Offset applied to the filtered slot list'),
    hasMore: z.boolean().describe('True when more slots can be fetched with a higher offset'),
    nextOffset: z.number().optional().describe('Offset to request the next page when hasMore=true'),
    waypoints: z.array(waypointSummarySchema),
});

export const getCurrentWaypointsDescription =
    'Read the waypoint slots currently staged for the next route calculation without recalculating anything. ' +
    'Use for follow-up questions like "what coordinates are staged now?", "which slots are filled?", or "what is destination slot 1?". ' +
    'Highly specific rules: slotIndex returns one known slot; otherwise results are paged, default to 5 slots, and empty slots are omitted unless includeEmptySlots=true to keep payloads compact. ' +
    'Does not call any service.';

export const executeGetCurrentWaypoints = async (
    params: z.infer<typeof getCurrentWaypointsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getCurrentWaypointsOutputSchema>> => {
    const { slotIndex, includeEmptySlots = false, offset = 0, limit = 5 } = params;
    const slots = state.routing.planningSlots.map((waypoint, index) => {
        const normalized = summarizeWaypoint(waypoint);
        return normalized ? { ...normalized, slotIndex: index } : { slotIndex: index, isFilled: false };
    });
    const filteredSlots = includeEmptySlots ? slots : slots.filter((slot) => slot.isFilled);
    const hasExactSlot = slotIndex !== undefined;
    const selected = hasExactSlot
        ? filteredSlots.filter((slot) => slot.slotIndex === slotIndex)
        : filteredSlots.slice(offset, offset + limit);
    const nextOffset = offset + selected.length;

    return {
        totalSlots: slots.length,
        filledSlots: slots.filter((slot) => slot.isFilled).length,
        matchedCount: hasExactSlot ? selected.length : filteredSlots.length,
        returnedCount: selected.length,
        offset: hasExactSlot ? 0 : offset,
        hasMore: !hasExactSlot && nextOffset < filteredSlots.length,
        ...(!hasExactSlot && nextOffset < filteredSlots.length && { nextOffset }),
        waypoints: selected,
    };
};
