import { z } from 'zod/v4-mini';
import { featureCollectionSchema, geometrySchema } from '../shared/geometriesSchema';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';

const geometrySearchRequestMandatory = z.object({
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema])),
});

/**
 * @ignore
 */
export const geometrySearchRequestSchema = z.extend(commonSearchParamsSchema, geometrySearchRequestMandatory).shape;
