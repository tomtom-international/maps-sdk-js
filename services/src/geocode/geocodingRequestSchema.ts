import { z } from 'zod/v4-mini';
import { commonPlacesParamsSchema } from '../shared/commonPlacesParamsSchema';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/commonGeocodeAndFuzzySearchParamsSchema';

/**
 * @ignore
 */
export const geocodingRequestSchema = z.extend(commonPlacesParamsSchema, commonGeocodeAndFuzzySearchParamsSchema).shape;
