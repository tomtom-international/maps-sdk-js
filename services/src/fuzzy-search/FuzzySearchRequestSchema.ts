import { z } from "zod";
import { commonSearchParamsSchema } from "../search/CommonSearchParamsSchema";
import { commonGeocodeAndFuzzySearchParamsSchema } from "../shared/CommonGeocodeAndFuzzySearchParamsSchema";

const fuzzySearchRequestOptional = z
    .object({
        minFuzzyLevel: z.number().min(1).max(4),
        mixFuzzyLevel: z.number().min(1).max(4)
    })
    .partial();

/**
 * @ignore
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.merge(
    commonGeocodeAndFuzzySearchParamsSchema.merge(fuzzySearchRequestOptional)
);
