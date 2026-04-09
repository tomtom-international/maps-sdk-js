/**
 * @module map-agent-tools
 */

import { Language, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the set-language tool. */
export const setLanguageOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        language: z.string(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for setting language.
 */
export const setLanguageSchema = z.object({
    language: z.string().describe('e.g. "en-US", "fr-FR"'),
});

export const setLanguageDescription =
    'Set the language used for map labels (place names, road names, POI labels) and for all subsequent service API calls (search results, geocoding, routing instructions, etc.). ' +
    'Both the rendered map text and future service responses will use the new language.';

/**
 * Execute set language.
 */
export async function executeSetLanguage(params: z.infer<typeof setLanguageSchema>, state: ToolState) {
    const { language } = params;
    try {
        TomTomConfig.instance.put({ language: language as Language });
        state.baseMap.ttMap.setLanguage(language as Language);

        return {
            success: true,
            language,
        };
    } catch (error) {
        return {
            error: `Failed to set language: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
