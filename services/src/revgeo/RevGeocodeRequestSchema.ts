import { z } from "zod";
import { views } from "@anw/go-sdk-js/core";
import { hasLngLatSchema } from "../shared/GeometriesSchema";

const revGeocodeRequestMandatory = z.object({
    position: hasLngLatSchema
});

const revGeocodeRequestOptional = z
    .object({
        allowFreeformNewline: z.boolean(),
        geographyType: z.string().array(),
        heading: z.number().min(-360).max(360),
        mapcodes: z.string().array(),
        number: z.string(),
        radius: z.number(),
        returnMatchType: z.boolean(),
        returnRoadUse: z.boolean(),
        returnSpeedLimit: z.boolean(),
        roadUses: z.string().array(),
        view: z.enum(views)
    })
    .partial();

/**
 * @ignore
 * @group Reverse Geocoding
 * @category Variables
 */
export const revGeocodeRequestSchema = revGeocodeRequestMandatory.merge(revGeocodeRequestOptional);
