import { z } from 'zod';
import { geoBiasSchema } from './geoBiasSchema';

/**
 * @ignore
 */
export const commonGeocodeAndFuzzySearchParamsSchema = z.object({
    typeahead: z.boolean().optional(),
    offset: z.number().max(1900).optional(),
    geoBias: geoBiasSchema.optional(),
    countries: z.array(z.string()).optional(),
});
