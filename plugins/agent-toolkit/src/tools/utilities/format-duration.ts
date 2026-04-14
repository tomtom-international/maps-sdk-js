/**
 * @module agent-toolkit-tools
 */

import { formatDuration } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';

/**
 * Tool schema for formatting duration.
 */
export const formatDurationSchema = z.object({
    seconds: z.number().describe('Duration in seconds to format'),
});

export const formatDurationDescription =
    'Format a duration in seconds into a human-readable time string (e.g. "1 h 30 min"). ' +
    'Use after getSectionProgress, recallRoutes, or any tool that returns durations in seconds.';

/** Execute function for formatDuration — usable with ToolEntry format. */
export const executeFormatDuration = async (params: z.infer<typeof formatDurationSchema>, _state: ToolState) => {
    const { seconds } = params;
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
};
