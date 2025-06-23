import { z } from "zod/v4-mini";
import { views } from "@anw/maps-sdk-js/core";
import { hasLngLatSchema } from "../shared/geometriesSchema";

const revGeocodeRequestMandatory = z.object({
    position: hasLngLatSchema
});

const revGeocodeRequestOptional = z.partial(
    z.object({
        allowFreeformNewline: z.boolean(),
        geographyType: z.array(z.string()),
        heading: z.number().check(z.minimum(-360), z.maximum(360)),
        mapcodes: z.array(z.string()),
        number: z.string(),
        radiusMeters: z.number(),
        returnMatchType: z.boolean(),
        returnRoadUse: z.boolean(),
        returnSpeedLimit: z.boolean(),
        roadUses: z.array(z.string()),
        view: z.enum(views)
    })
);

/**
 * @ignore
 */
export const revGeocodeRequestSchema = z.extend(revGeocodeRequestMandatory, revGeocodeRequestOptional).shape;
