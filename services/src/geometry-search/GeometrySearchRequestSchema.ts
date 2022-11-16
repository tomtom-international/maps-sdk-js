import { views } from "@anw/go-sdk-js/core";
import { z } from "zod";
import { featureCollectionSchema, geometrySchema, hasLngLatSchema } from "../shared/GeometriesSchema";
import { poiCategoriesToID } from "../poi-categories/poiCategoriesToID";
import { ZodRawShape } from "zod/lib/types";

const geometrySearchRequestMandatory = z.object({
    query: z.string(),
    geometries: z.array(z.union([featureCollectionSchema, geometrySchema]))
});

const poiCategoriesToIDZodObject = z.object(poiCategoriesToID as unknown as ZodRawShape);

const geometrySearchRequestOptional = z
    .object({
        position: hasLngLatSchema,
        limit: z.number(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(views),
        geographyTypes: z.string().array(),
        indexes: z.string().array(),
        poiCategories: z.array(poiCategoriesToIDZodObject.keyof()),
        poiBrands: z.string().array(),
        connectors: z.string().array(),
        fuels: z.string().array(),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string(),
        minPowerKW: z.number(),
        maxPowerKW: z.number()
    })
    .partial();

/**
 * @ignore
 * @group Geometry Search
 * @category Types
 */
export const geometrySearchRequestSchema = geometrySearchRequestMandatory.merge(geometrySearchRequestOptional);
