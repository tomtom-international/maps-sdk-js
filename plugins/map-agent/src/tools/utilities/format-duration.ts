/**
 * @module map-agent-tools
 */

import { formatDuration } from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for formatting duration.
 */
export const formatDurationSchema = z.object({
    seconds: z.number().describe('Duration in seconds to format'),
});

/**
 * Create the format duration tool.
 */
export function createFormatDurationTool(_context: ToolContext): Tool {
    return dynamicTool({
        description: 'Format a duration in seconds into a human-readable time string (e.g., "2 hr 30 min", "45 min").',
        inputSchema: formatDurationSchema,
        execute: async (params) => {
            const { seconds } = params as z.infer<typeof formatDurationSchema>;
            try {
                const formatted = formatDuration(seconds);

                if (formatted === undefined) {
                    return {
                        formatted: undefined,
                        message: '< 1 min',
                        input: { seconds },
                    };
                }

                return {
                    formatted,
                    input: { seconds },
                };
            } catch (error) {
                return {
                    error: `Failed to format duration: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
