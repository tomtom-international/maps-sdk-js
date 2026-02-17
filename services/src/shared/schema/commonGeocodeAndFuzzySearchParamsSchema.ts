import { z } from 'zod';
import { hasBBoxSchema } from './geometriesSchema';

/**
 * @ignore
 */
export const commonGeocodeAndFuzzySearchParamsSchema = z.object({
    typeahead: z.boolean().optional().describe('Enable predictive/autocomplete mode for partial input queries'),
    offset: z
        .number()
        .max(1900)
        .optional()
        .describe('Starting position within result set for pagination (zero-based index)'),
    radiusMeters: z.number().optional().describe('Search radius in meters around the specified position'),
    boundingBox: hasBBoxSchema.optional().describe('Bounding box to constrain search results to a rectangular area'),
    countries: z.array(z.string()).optional().describe('Country codes to restrict search results (ISO 3166-1 alpha-2)'),
});
