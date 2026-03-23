import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

const autocompleteSearchRequestMandatory = z.object({
    query: z.string(),
});

const autocompleteSearchRequestOptional = z.object({
    position: hasLngLatSchema.optional(),
    limit: z.number().max(100).optional(),
    radiusMeters: z.number().optional(),
    countries: z.array(z.string()).optional(),
    resultType: z.array(z.string()).optional(),
});

/**
 * @ignore
 */
export const autocompleteSearchRequestSchema = autocompleteSearchRequestMandatory.extend(
    autocompleteSearchRequestOptional.shape,
);
