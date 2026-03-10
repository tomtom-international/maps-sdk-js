import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';

/**
 * @ignore
 */
export const poiCategoriesRequestSchema = commonServiceRequestSchema.extend({
    filters: z
        .array(z.string())
        .optional()
        .describe(
            'Case-insensitive filter strings applied client-side to category names and synonyms. Results from all strings are merged and deduplicated.',
        ),
});
