import { z } from "zod";
import { featureCollectionSchema, geometrySchema } from "../shared/geometriesSchema";
import { commonSearchParamsSchema } from "../search/commonSearchParamsSchema";

const geometrySearchRequestMandatory = z.object({
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema]))
});

/**
 * @ignore
 */
export const geometrySearchRequestSchema = commonSearchParamsSchema.merge(geometrySearchRequestMandatory);
