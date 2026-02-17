/**
 * @module map-agent-tools
 */

import { Language, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for setting language.
 */
const setLanguageSchema = z.object({
    language: z.string().describe('Language code (e.g., "en-US", "fr-FR", "de-DE")'),
});

/**
 * Create the set language tool.
 */
export function createSetLanguageTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Change the language of map labels',
        inputSchema: setLanguageSchema,
        execute: async (params) => {
            const { language } = params as z.infer<typeof setLanguageSchema>;
            try {
                TomTomConfig.instance.put({ language: language as Language });
                context.state.map.setLanguage(language as any);

                return {
                    success: true,
                    language,
                };
            } catch (error) {
                return {
                    error: `Failed to set language: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
