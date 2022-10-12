import { z } from "zod";

const geometryDataRequestMandatory = z.object({
    geometries: z.string().array()
});

const geometryDataRequestOptional = z
    .object({
        zoom: z.number().min(0).max(22)
    })
    .partial();

export const geometryDataRequestSchema = geometryDataRequestMandatory.merge(geometryDataRequestOptional);
