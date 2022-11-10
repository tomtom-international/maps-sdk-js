import { z } from "zod";
import { geometrySchema, hasLngLatSchema } from "../shared/GeometriesSchema";
import { views } from "@anw/go-sdk-js/core";

const geometrySearchRequestMandatory = z.object({
    query: z.string(),
    geometries: z.array(geometrySchema)
});

const geometrySearchRequestOptional = z
    .object({
        position: hasLngLatSchema,
        limit: z.number(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(views),
        geographyTypes: z.string().array(),
        indexes: z.string().array(),
        poiCategories: z.number().array(),
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
