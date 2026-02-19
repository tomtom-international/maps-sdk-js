/**
 * @module map-agent-tools
 */

import { standardStyleIDs } from '@tomtom-org/maps-sdk/map';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting standard map styles.
 */
export const getStandardMapStylesSchema = z.object({});

/**
 * Create the get standard map styles tool.
 */
export function createGetStandardMapStylesTool(_context: ToolContext): Tool {
    return tool({
        description: 'Get the list of available standard map style IDs',
        inputSchema: getStandardMapStylesSchema,
        execute: async () => {
            try {
                return {
                    styles: standardStyleIDs,
                };
            } catch (error) {
                return {
                    error: `Failed to get standard map styles: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
