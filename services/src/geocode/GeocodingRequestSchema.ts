import { z } from "zod";
import { hasLngLatSchema } from "../shared/GeometriesSchema";
import { views } from "core";

const geocodingRequestMandatory = z.object({
    query: z.string()
});

const geocodingRequestOptional = z
    .object({
        typeahead: z.boolean(),
        limit: z.number().max(100),
        offset: z.number().max(1900),
        position: hasLngLatSchema,
        countries: z.string().array(),
        radiusMeters: z.number(),
        boundingBox: z.any(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(views),
        geographyTypes: z.string().array()
    })
    .partial();

export const geocodingRequestSchema = geocodingRequestMandatory.merge(geocodingRequestOptional);
