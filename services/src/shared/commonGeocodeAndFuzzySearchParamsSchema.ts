import { z } from "zod/v4-mini";
import { hasBBoxSchema } from "./geometriesSchema";

/**
 * @ignore
 */
export const commonGeocodeAndFuzzySearchParamsSchema = z.partial(
    z.object({
        typeahead: z.boolean(),
        offset: z.number().check(z.maximum(1900)),
        radiusMeters: z.number(),
        boundingBox: hasBBoxSchema,
        countries: z.array(z.string())
    })
);
