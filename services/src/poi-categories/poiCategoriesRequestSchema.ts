import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';

/**
 * @ignore
 */
export const poiCategoriesRequestSchema = commonServiceRequestSchema.extend({
    filters: z.array(z.string()).optional(),
});
