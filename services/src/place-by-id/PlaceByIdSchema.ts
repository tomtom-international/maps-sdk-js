import { z } from "zod";

const placeByIdParamsMandatory = z.object({
    entityId: z.string()
});

const placeByIdParamsOptional = z
    .object({
        mapcodes: z.string().array(),
        view: z.string(),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string()
    })
    .partial();

export const placeByIdRequestSchema = placeByIdParamsMandatory.merge(placeByIdParamsOptional);
