/**
 * @module map-agent-tools
 */

import { formatDistance } from '@tomtom-org/maps-sdk/core';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for formatting distance.
 */
export const formatDistanceSchema = z.object({
    meters: z.number().describe('Distance in meters to format'),
    unitType: z
        .enum(['metric', 'imperial_us', 'imperial_uk'])
        .optional()
        .describe('Unit system to use (metric, imperial_us, or imperial_uk). Defaults to metric if not specified.'),
});

/**
 * Create the format distance tool.
 */
export function createFormatDistanceTool(_context: ToolContext): Tool {
    return tool({
        description:
            'Format a distance in meters into a human-readable string using the appropriate units (e.g., "2.5 km", "1½ mi", "500 ft"). Supports metric, US imperial, and UK imperial unit systems.',
        inputSchema: formatDistanceSchema,
        execute: async (params) => {
            const { meters, unitType } = params;
            try {
                const formatted = formatDistance(meters, unitType ? { type: unitType } : undefined);

                return {
                    formatted,
                    input: {
                        meters,
                        unitType: unitType || 'metric',
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
