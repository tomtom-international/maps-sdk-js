import { z } from "zod";
import { hasBBoxSchema } from "./geometriesSchema";

/**
 * @ignore
 */
export const commonGeocodeAndFuzzySearchParamsSchema = z
    .object({
        typeahead: z.boolean(),
        offset: z.number().max(1900),
        radiusMeters: z.number(),
        boundingBox: hasBBoxSchema,
        countries: z.string().array()
    })
    .partial();
