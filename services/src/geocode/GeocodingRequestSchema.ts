import { commonPlacesParamsSchema } from "../shared/CommonPlacesParamsSchema";
import { commonGeocodeAndFuzzySearchParamsSchema } from "../shared/CommonGeocodeAndFuzzySearchParamsSchema";

/**
 * @ignore
 */
export const geocodingRequestSchema = commonPlacesParamsSchema.merge(commonGeocodeAndFuzzySearchParamsSchema);
