import { z } from "zod";
import { hasLngLatSchema } from "../shared/GeometriesSchema";

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
 * @group Autocomplete
 * @category Types
 */
export const autocompleteSearchRequestSchema = autocompleteSearchRequestMandatory.merge(
    autocompleteSearchRequestOptional
);
