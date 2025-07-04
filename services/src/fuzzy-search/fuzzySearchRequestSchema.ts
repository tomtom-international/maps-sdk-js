import { z } from 'zod/v4-mini';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/commonGeocodeAndFuzzySearchParamsSchema';

const fuzzySearchRequestOptional = z.partial(
    z.object({
        minFuzzyLevel: z.number().check(z.minimum(1), z.maximum(4)),
        maxFuzzyLevel: z.number().check(z.minimum(1), z.maximum(4)),
    }),
);

/**
 * @ignore
 */
export const fuzzySearchRequestSchema = z.extend(
    commonSearchParamsSchema,
    z.extend(commonGeocodeAndFuzzySearchParamsSchema, fuzzySearchRequestOptional.shape).shape,
);
