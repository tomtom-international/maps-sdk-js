/**
 * @module map-agent-tools
 */

import { formatDistance } from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';

/**
 * Tool schema for formatting distance.
 */
export const formatDistanceSchema = z.object({
    meters: z.number().describe('Distance in meters to format'),
    unitType: z.enum(['metric', 'imperial_us', 'imperial_uk']).optional().describe('default: metric'),
});

export const formatDistanceDescription =
    'Format a distance in meters into a human-readable string (e.g. "2.5 km", "1.5 mi"). ' +
    'Use after getSectionProgress, recallRoutes, or any tool that returns distances in meters.';

/**
 * Create the format distance tool.
 */
export function createFormatDistanceTool(_state: ToolState): Tool {
    return tool({
        description: formatDistanceDescription,
        inputSchema: formatDistanceSchema,
        execute: async (params) => {
            const { meters, unitType } = params;
            try {
                const formatted = formatDistance(meters, unitType ? { type: unitType } : undefined);

                return {
                    formatted,
                    input: {
                        meters,
                        unitType: unitType ?? 'metric',
                    },
                };
            } catch (error) {
                return {
                    error: `Failed to format distance: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
