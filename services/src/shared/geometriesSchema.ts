import { z } from 'zod/v4-mini';

/**
 * @ignore
 */
export const lineStringCoordsSchema = z.array(z.array(z.number()));

/**
 * @ignore
 */
export const geometrySchema = z
    .object({
        type: z.enum([
            'Point',
            'MultiPoint',
            'LineString',
            'MultiLineString',
            'Polygon',
            'MultiPolygon',
            'GeometryCollection',
            'Circle',
        ]),
        coordinates: z.union([
            z.array(z.number()),
            lineStringCoordsSchema,
            z.array(z.array(z.array(z.number()))),
            z.array(z.array(z.array(z.array(z.number())))),
        ]),
        radius: z.optional(z.number()),
        radiusMeters: z.optional(z.number()),
        bbox: z.optional(z.array(z.number())),
    })
    .check(
        z.refine(
            (data) => (data.type === 'Circle' ? Boolean(data.radius) : true),
            'type: "Circle" must have radius property',
        ),
    );

/**
 * @ignore
 */
export const featureSchema = z.object({
    type: z.literal('Feature'),
    geometry: geometrySchema,
    id: z.optional(z.union([z.string(), z.number()])),
    properties: z.any(),
    bbox: z.optional(z.array(z.number())),
});

/**
 * @ignore
 */
export const featureCollectionSchema = z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(featureSchema),
    id: z.optional(z.union([z.string(), z.number()])),
    properties: z.any(),
    bbox: z.optional(z.array(z.number())),
});

/**
 * @ignore
 */
export const hasLngLatSchema = z.union([
    z.tuple([z.number().check(z.minimum(-180), z.maximum(180)), z.number().check(z.minimum(-90), z.maximum(90))]),
    z.tuple([
        z.number().check(z.minimum(-180), z.maximum(180)),
        z.number().check(z.minimum(-90), z.maximum(90)),
        z.number(),
    ]),
    z.object({
        type: z.literal('Point'),
        coordinates: z.array(z.number()),
    }),
    featureSchema,
]);

/**
 * @ignore
 */
const geoJsonbBoxSchema = z.union([z.array(z.number()).check(z.length(4)), z.array(z.number()).check(z.length(6))]);

/**
 * @ignore
 */
export const geoJSONObjectSchema = z.union([geometrySchema, featureSchema, featureCollectionSchema]);

/**
 * @ignore
 */
export const hasBBoxSchema = z.union([geoJsonbBoxSchema, geoJSONObjectSchema, z.array(geoJSONObjectSchema)]);
