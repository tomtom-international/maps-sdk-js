import { z } from "zod";
import { poiCategoriesToID } from "../poi-categories/poiCategoriesToID";
import { ZodRawShape } from "zod/lib/types";
import { commonPlacesParamsSchema } from "../shared/commonPlacesParamsSchema";

const poiCategoriesToIDZodObject = z.object(poiCategoriesToID as unknown as ZodRawShape);

const searchExtraParamsOptional = z
    .object({
        indexes: z.string().array(),
        poiCategories: z.array(z.number().or(poiCategoriesToIDZodObject.keyof())),
        poiBrands: z.string().array(),
        connectors: z.string().array(),
        fuelTypes: z.string().array(),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string(),
        minPowerKW: z.number(),
        maxPowerKW: z.number(),
        minFuzzyLevel: z.number(),
        mixFuzzyLevel: z.number()
    })
    .partial();

/**
 * @ignore
 */
export const commonSearchParamsSchema = commonPlacesParamsSchema.merge(searchExtraParamsOptional);
