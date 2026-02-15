import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/schema/commonGeocodeAndFuzzySearchParamsSchema';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';
import { commonPlacesParamsSchema } from '../shared/schema/commonPlacesParamsSchema';

/**
 * @ignore
 */
export const geocodingRequestSchema = commonServiceRequestSchema
    .extend(commonPlacesParamsSchema.shape)
    .extend(commonGeocodeAndFuzzySearchParamsSchema.shape);
