import { z } from "zod";
import { commonSearchParamsSchema } from "../search/commonSearchParamsSchema";
import { commonGeocodeAndFuzzySearchParamsSchema } from "../shared/commonGeocodeAndFuzzySearchParamsSchema";

const fuzzySearchRequestOptional = z
    .object({
        minFuzzyLevel: z.number().min(1).max(4),
        maxFuzzyLevel: z.number().min(1).max(4)
    })
    .partial();

/**
 * @ignore
 */
export const fuzzySearchRequestSchema = commonSearchParamsSchema.merge(
    commonGeocodeAndFuzzySearchParamsSchema.merge(fuzzySearchRequestOptional)
);
