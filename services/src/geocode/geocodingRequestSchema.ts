import { z } from 'zod/v4-mini';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/schema/commonGeocodeAndFuzzySearchParamsSchema';
import { commonPlacesParamsSchema } from '../shared/schema/commonPlacesParamsSchema';

/**
 * @ignore
 */
export const geocodingRequestSchema = z.extend(commonPlacesParamsSchema, commonGeocodeAndFuzzySearchParamsSchema.shape);
