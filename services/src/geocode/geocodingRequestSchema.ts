import { z } from 'zod/v4-mini';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/commonGeocodeAndFuzzySearchParamsSchema';
import { commonPlacesParamsSchema } from '../shared/commonPlacesParamsSchema';

/**
 * @ignore
 */
export const geocodingRequestSchema = z.extend(commonPlacesParamsSchema, commonGeocodeAndFuzzySearchParamsSchema).shape;
