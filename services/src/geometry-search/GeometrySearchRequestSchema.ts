import { z } from "zod";
import { featureCollectionSchema, geometrySchema } from "../shared/GeometriesSchema";
import { commonSearchParamsSchema } from "../search/CommonSearchParamsSchema";

const geometrySearchRequestMandatory = z.object({
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema]))
});

/**
 * @ignore
 * @group Geometry Search
 * @category Types
 */
export const geometrySearchRequestSchema = commonSearchParamsSchema.merge(geometrySearchRequestMandatory);
