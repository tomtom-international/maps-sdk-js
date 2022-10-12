import { z } from "zod";

const geocodingRequestMandatory = z.object({
    query: z.string()
});

const geocodingRequestOptional = z
    .object({
        typeahead: z.boolean(),
        limit: z.number().max(100),
        offset: z.number().max(1900),
        position: z.any().array(),
        countries: z.string().array(),
        radiusMeters: z.number(),
        boundingBox: z.any(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"]),
        geographyTypes: z.string().array()
    })
    .partial();

export const geocodingRequestSchema = geocodingRequestMandatory.merge(geocodingRequestOptional);
