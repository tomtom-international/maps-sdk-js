import { z } from "zod";

const geometrySearchRequestMandatory = z.object({
    query: z.string(),
    geometries: z.array(
        z
            .object({
                type: z.string(),
                coordinates: z.union([
                    z.array(z.number()),
                    z.array(z.array(z.number())),
                    z.array(z.array(z.array(z.number())))
                ]),
                radius: z.number().optional()
            })
            .refine(
                (data) => (data.type === "Circle" ? Boolean(data.radius) : true),
                'type: "Circle" must have radius property'
            )
    )
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
