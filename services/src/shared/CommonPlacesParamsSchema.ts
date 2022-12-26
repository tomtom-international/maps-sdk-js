import { views } from "@anw/go-sdk-js/core";
import { z } from "zod";
import { hasLngLatSchema } from "./GeometriesSchema";

const placesParamsMandatory = z.object({
    query: z.string()
});

const placesParamsOptional = z
    .object({
        position: hasLngLatSchema,
        limit: z.number().max(100),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(views),
        geographyTypes: z.string().array()
    })
    .partial();

/**
 * @ignore
 * @group Search
 * @category Types
 */
export const commonPlacesParamsSchema = placesParamsMandatory.merge(placesParamsOptional);
