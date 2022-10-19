import { z } from "zod";
import { views } from "core";

const placeByIdRequestMandatory = z.object({
    entityId: z.string()
});

const placeByIdRequestOptional = z
    .object({
        mapcodes: z.string().array(),
        view: z.enum(views),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string()
    })
    .partial();

export const placeByIdRequestSchema = placeByIdRequestMandatory.merge(placeByIdRequestOptional);
