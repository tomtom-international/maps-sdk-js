import { z } from "zod";
import { geometrySchema } from "../shared/GeometriesSchema";

const geometrySearchRequestMandatory = z.object({
    query: z.string(),
    geometries: z.array(geometrySchema)
});

const geometrySearchRequestOptional = z
    .object({
        limit: z.number(),
        extendedPostalCodesFor: z.string().array(),
        mapcodes: z.string().array(),
        view: z.enum(["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"]),
        geographyType: z.string().array(),
        indexes: z.string().array(),
        poiCategories: z.number().array(),
        poiBrands: z.string().array(),
        connectors: z.string().array(),
        fuels: z.string().array(),
        openingHours: z.string(),
        timeZone: z.string(),
        relatedPois: z.string(),
        minPowerKW: z.number(),
        maxPowerKW: z.number(),
        entityTypes: z.string().array()
    })
    .partial();

export const geometrySearchRequestSchema = geometrySearchRequestMandatory.merge(geometrySearchRequestOptional);
