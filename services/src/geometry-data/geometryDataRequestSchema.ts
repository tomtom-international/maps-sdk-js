import { z } from "zod";
import { featureCollectionSchema, featureSchema } from "../shared/geometriesSchema";

const geometryDataRequestMandatory = z.object({
    geometries: z.union([featureCollectionSchema, z.union([z.string(), featureSchema]).array().min(1).max(20)])
});

const geometryDataRequestOptional = z
    .object({
        zoom: z.number().min(0).max(22)
    })
    .partial();

export const geometryDataRequestSchema = geometryDataRequestMandatory.merge(geometryDataRequestOptional);
