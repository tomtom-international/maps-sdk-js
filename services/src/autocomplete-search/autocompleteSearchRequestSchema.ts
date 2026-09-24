import { z } from 'zod';
import { pointGeoBiasSchema } from '../shared/schema/geoBiasSchema';

const autocompleteSearchRequestMandatory = z.object({
    query: z.string(),
});

const autocompleteSearchRequestOptional = z.object({
    geoBias: pointGeoBiasSchema.optional(),
    limit: z.number().max(100).optional(),
    countries: z.array(z.string()).optional(),
    resultType: z.array(z.string()).optional(),
});

/**
 * @ignore
 */
export const autocompleteSearchRequestSchema = autocompleteSearchRequestMandatory.extend(
    autocompleteSearchRequestOptional.shape,
);
