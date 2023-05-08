import { z } from "zod";
import { hasLngLatSchema } from "../shared/geometriesSchema";

const autocompleteSearchRequestMandatory = z.object({
    query: z.string()
});

const autocompleteSearchRequestOptional = z
    .object({
        position: hasLngLatSchema,
        limit: z.number().max(100),
        radiusMeters: z.number(),
        countries: z.string().array(),
        resultType: z.string().array()
    })
    .partial();

/**
 * @ignore
 */
export const autocompleteSearchRequestSchema = autocompleteSearchRequestMandatory.merge(
    autocompleteSearchRequestOptional
);
