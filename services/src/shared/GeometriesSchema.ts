import { z } from "zod";

/**
 * @ignore
 */
export const geometrySchema = z
    .object({
        type: z.enum([
            "Point",
            "MultiPoint",
            "LineString",
            "MultiLineString",
            "Polygon",
            "MultiPolygon",
            "GeometryCollection",
            "Circle"
        ]),
        coordinates: z.union([
            z.array(z.number()),
            z.array(z.array(z.number())),
            z.array(z.array(z.array(z.number()))),
            z.array(z.array(z.array(z.array(z.number()))))
        ]),
        radius: z.number().optional(),
        radiusMeters: z.number().optional(),
        bbox: z.array(z.number()).optional()
    })
    .refine(
        (data) => (data.type === "Circle" ? Boolean(data.radius) : true),
        'type: "Circle" must have radius property'
    );

/**
 * @ignore
 */
export const featureSchema = z.object({
    type: z.literal("Feature"),
    geometry: geometrySchema,
    id: z.union([z.string(), z.number()]).optional(),
    properties: z.any(),
    bbox: z.array(z.number()).optional()
});

/**
 * @ignore
 */
export const featureCollectionSchema = z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(featureSchema),
    id: z.union([z.string(), z.number()]).optional(),
    properties: z.any(),
    bbox: z.array(z.number()).optional()
});

/**
 * @ignore
 */
export const hasLngLatSchema = z.union([
    z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90), z.number()]),
    z.object({
        type: z.literal("Point"),
        coordinates: z.number().array()
    }),
    featureSchema
]);

/**
 * @ignore
 */
const geoJSONBBoxSchema = z.array(z.number()).length(4).or(z.array(z.number()).length(6));

/**
 * @ignore
 */
export const geoJSONObjectSchema = geometrySchema.or(featureSchema).or(featureCollectionSchema);

/**
 * @ignore
 */
export const hasBBoxSchema = geoJSONBBoxSchema.or(geoJSONObjectSchema).or(z.array(geoJSONObjectSchema));
