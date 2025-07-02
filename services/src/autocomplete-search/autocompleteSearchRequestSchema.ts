import { z } from 'zod/v4-mini';
import { hasLngLatSchema } from '../shared/geometriesSchema';

const autocompleteSearchRequestMandatory = z.object({
    query: z.string(),
});

const autocompleteSearchRequestOptional = z.partial(
    z.object({
        position: hasLngLatSchema,
        limit: z.number().check(z.maximum(100)),
        radiusMeters: z.number(),
        countries: z.array(z.string()),
        resultType: z.array(z.string()),
    }),
);

/**
 * @ignore
 */
export const autocompleteSearchRequestSchema = z.extend(
    autocompleteSearchRequestMandatory,
    autocompleteSearchRequestOptional,
).shape;
