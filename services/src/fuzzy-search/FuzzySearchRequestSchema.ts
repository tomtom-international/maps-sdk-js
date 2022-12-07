import { z } from "zod";
import { commonSearchParamsSchema } from "../search/CommonSearchParamsSchema";
const fuzzySearchRequestOptional = z
    .object({
        typeahead: z.boolean(),
        offset: z.number(),
        countries: z.string().array(),
        radiusMeters: z.number(),
        bbox: z.array(z.number()).optional(),
        minFuzzyLevel: z.number().min(1).max(4),
        mixFuzzyLevel: z.number().min(1).max(4)
    })
    .partial();

/**
 * @ignore
 * @group Fuzzy Search
 * @category Types
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.merge(fuzzySearchRequestOptional);
