import { z } from 'zod';
import { hasBBoxSchema } from './geometriesSchema';

/**
 * @ignore
 */
export const commonGeocodeAndFuzzySearchParamsSchema = z.object({
    typeahead: z.boolean().optional(),
    offset: z.number().max(1900).optional(),
    radiusMeters: z.number().optional(),
    boundingBox: hasBBoxSchema.optional(),
    countries: z.array(z.string()).optional(),
});
