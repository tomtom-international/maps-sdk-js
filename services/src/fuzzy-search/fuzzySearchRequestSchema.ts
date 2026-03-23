import { z } from 'zod';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/schema/commonGeocodeAndFuzzySearchParamsSchema';

const fuzzySearchRequestOptional = z.object({
    minFuzzyLevel: z.number().min(1).max(4).optional(),
    maxFuzzyLevel: z.number().min(1).max(4).optional(),
});

/**
 * @ignore
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.extend(
    commonGeocodeAndFuzzySearchParamsSchema.extend(fuzzySearchRequestOptional.shape).shape,
);
