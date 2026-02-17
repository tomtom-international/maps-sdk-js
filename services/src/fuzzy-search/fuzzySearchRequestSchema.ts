import { z } from 'zod';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/schema/commonGeocodeAndFuzzySearchParamsSchema';

const fuzzySearchRequestOptional = z.object({
    minFuzzyLevel: z
        .number()
        .min(1)
        .max(4)
        .optional()
        .describe('Minimum fuzzy matching level (1-4, higher allows more typos)'),
    maxFuzzyLevel: z
        .number()
        .min(1)
        .max(4)
        .optional()
        .describe('Maximum fuzzy matching level (1-4, higher allows more typos)'),
});

/**
 * @ignore
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.extend(
    commonGeocodeAndFuzzySearchParamsSchema.extend(fuzzySearchRequestOptional.shape).shape,
);
