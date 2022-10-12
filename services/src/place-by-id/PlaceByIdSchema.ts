import { z } from "zod";

const placeByIdRequestMandatory = z.object({
    entityId: z.string()
});

const placeByIdRequestOptional = z
    .object({
        mapcodes: z.string().array(),
        view: z.string(),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string()
    })
    .partial();

export const placeByIdRequestSchema = placeByIdRequestMandatory.merge(placeByIdRequestOptional);
