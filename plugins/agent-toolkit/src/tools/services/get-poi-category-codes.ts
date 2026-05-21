/**
 * @module agent-toolkit-tools
 */

import { type Language } from '@tomtom-org/maps-sdk/core';
import { getPOICategoryCodes } from '@tomtom-org/maps-sdk/services';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-poi-category-codes tool. */
export const getPoiCategoryCodesOutputSchema = z.union([
    z.object({
        count: z.number().describe('Number of codes returned'),
        codes: z
            .array(z.string())
            .describe(
                'POICategory enum values for discoverPlaces poiCategories. Generic codes (e.g. "RESTAURANT") also accepted by toggleTilesPOIs categories.',
            ),
    }),
    toolErrorSchema,
]);

/**
 * Tool input schema for fetching POI category codes.
 */
export const getPoiCategoryCodesSchema = z.object({
    filters: z
        .array(z.string())
        .optional()
        .describe(
            'Case-insensitive filter strings matched against category names and synonyms. Omit to return all codes.',
        ),
    language: z.string().describe('Locale e.g. "en-GB", "fr-FR", "es-ES", "de-DE".'),
});

export const getPoiCategoryCodesDescription =
    'Resolve natural language (e.g. "gym", "italian food", "bookstore") into POICategory codes for use in the discoverPlaces poiCategories parameter. Returns all codes when no filter is given.';

/**
 * Create the get-poi-category-codes tool.
 */
/** Standalone execute for ToolEntry format. */
export const executeGetPoiCategoryCodes = async (
    params: z.infer<typeof getPoiCategoryCodesSchema>,
    _state: ToolState,
): Promise<z.infer<typeof getPoiCategoryCodesOutputSchema>> => {
    const { filters, language } = params;
    try {
        const codes = await getPOICategoryCodes({
            filters,
            language: language as Language,
        });
        return {
            count: codes.length,
            codes,
        };
    } catch (error) {
        return {
            error: `Failed to fetch POI category codes: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
