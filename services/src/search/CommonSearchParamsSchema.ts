import { views } from "@anw/go-sdk-js/core";
import { z } from "zod";
import { hasLngLatSchema } from "../shared/GeometriesSchema";
import { poiCategoriesToID } from "../poi-categories/poiCategoriesToID";
import { ZodRawShape } from "zod/lib/types";

const searchParamsMandatory = z.object({
    query: z.string()
});

const poiCategoriesToIDZodObject = z.object(poiCategoriesToID as unknown as ZodRawShape);

const searchParamsOptional = z
    .object({
        position: hasLngLatSchema,
        limit: z.number(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(views),
        geographyTypes: z.string().array(),
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
 * @group Search
 * @category Types
 */
export const commonSearchParamsSchema = searchParamsMandatory.merge(searchParamsOptional);
