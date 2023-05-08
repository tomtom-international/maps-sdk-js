import { commonPlacesParamsSchema } from "../shared/commonPlacesParamsSchema";
import { commonGeocodeAndFuzzySearchParamsSchema } from "../shared/commonGeocodeAndFuzzySearchParamsSchema";

/**
 * @ignore
 */
export const geocodingRequestSchema = commonPlacesParamsSchema.merge(commonGeocodeAndFuzzySearchParamsSchema);
