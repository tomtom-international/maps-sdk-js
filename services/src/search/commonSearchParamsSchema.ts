import { z, type ZodMiniObject } from "zod/v4-mini";
import { poiCategoriesToID } from "../poi-categories/poiCategoriesToID";
import { commonPlacesParamsSchema } from "../shared/commonPlacesParamsSchema";

const poiCategoriesToIDZodObject = z.object(poiCategoriesToID) as unknown as ZodMiniObject;

const searchExtraParamsOptional = z.partial(
    z.object({
        indexes: z.array(z.string()),
        poiCategories: z.array(z.union([z.number(), z.keyof(poiCategoriesToIDZodObject)])),
        poiBrands: z.array(z.string()),
        connectors: z.array(z.string()),
        fuelTypes: z.array(z.string()),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string(),
        minPowerKW: z.number(),
        maxPowerKW: z.number(),
        minFuzzyLevel: z.number(),
        mixFuzzyLevel: z.number()
    })
);

/**
 * @ignore
 */
export const commonSearchParamsSchema = z.extend(commonPlacesParamsSchema, searchExtraParamsOptional).shape;
