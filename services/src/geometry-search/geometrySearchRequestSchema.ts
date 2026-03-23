import { z } from 'zod';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { featureCollectionSchema, geometrySchema } from '../shared/schema/geometriesSchema';

const geometrySearchRequestMandatory = z.object({
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema])),
});

/**
 * @ignore
 */
export const geometrySearchRequestSchema = commonSearchParamsSchema.extend(geometrySearchRequestMandatory.shape);
