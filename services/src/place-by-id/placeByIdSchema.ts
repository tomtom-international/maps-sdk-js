import { z } from "zod/v4-mini";
import { views } from "@anw/maps-sdk-js/core";

const placeByIdRequestMandatory = z.object({
    entityId: z.string()
});

const placeByIdRequestOptional = z.partial(
    z.object({
        mapcodes: z.array(z.string()),
        view: z.enum(views),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string()
    })
);

/**
 * @ignore
 */
export const placeByIdRequestSchema = z.extend(placeByIdRequestMandatory, placeByIdRequestOptional).shape;
