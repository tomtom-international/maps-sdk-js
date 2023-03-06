import { z } from "zod";
import { featureCollectionSchema, geometrySchema } from "../shared/GeometriesSchema";
import { commonSearchParamsSchema } from "../search/CommonSearchParamsSchema";

const geometrySearchRequestMandatory = z.object({
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema]))
});

/**
 * @ignore
 */
export const geometrySearchRequestSchema = commonSearchParamsSchema.merge(geometrySearchRequestMandatory);
