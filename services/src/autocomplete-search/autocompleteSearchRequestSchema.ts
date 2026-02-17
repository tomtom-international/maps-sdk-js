import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

const autocompleteSearchRequestMandatory = z.object({
    query: z.string().describe('Partial search query for autocomplete suggestions'),
});

const autocompleteSearchRequestOptional = z.object({
    position: hasLngLatSchema.optional().describe('Geographic position [longitude, latitude] to bias search results'),
    limit: z.number().max(100).optional().describe('Maximum number of autocomplete suggestions to return (1-100)'),
    radiusMeters: z.number().optional().describe('Search radius in meters around the specified position'),
    countries: z.array(z.string()).optional().describe('Country codes to restrict search results (ISO 3166-1 alpha-2)'),
    resultType: z.array(z.string()).optional().describe('Types of results to include in suggestions'),
});

/**
 * @ignore
 */
export const autocompleteSearchRequestSchema = autocompleteSearchRequestMandatory.extend(
    autocompleteSearchRequestOptional.shape,
);
