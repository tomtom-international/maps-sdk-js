import { z } from "zod";
import { hasLngLatSchema } from "../shared/GeometriesSchema";

const autocompleteRequestMandatory = z.object({
    query: z.string(),
    language: z.string()
});

const autocompleteRequestOptional = z
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
export const autocompleteRequestSchema = autocompleteRequestMandatory.merge(autocompleteRequestOptional);
