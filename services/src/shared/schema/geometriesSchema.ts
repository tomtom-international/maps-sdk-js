import { z } from 'zod';

/**
 * @ignore
 */
export const lineStringCoordsSchema = z
    .array(z.array(z.number()))
    .describe('Array of coordinate arrays representing a line string');

/**
 * @ignore
 */
export const geometrySchema = z
    .object({
        type: z
            .enum([
                'Point',
                'MultiPoint',
                'LineString',
                'MultiLineString',
                'Polygon',
                'MultiPolygon',
                'GeometryCollection',
                'Circle',
            ])
            .describe('GeoJSON geometry type'),
        coordinates: z
            .union([
                z.array(z.number()),
                lineStringCoordsSchema,
                z.array(z.array(z.array(z.number()))),
                z.array(z.array(z.array(z.array(z.number())))),
            ])
            .describe('Coordinate array(s) for the geometry'),
        radius: z.optional(z.number()).describe('Radius for Circle geometries'),
        radiusMeters: z.optional(z.number()).describe('Radius in meters for Circle geometries'),
        bbox: z.optional(z.array(z.number())).describe('Bounding box [minLng, minLat, maxLng, maxLat]'),
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
    type: z.literal('Feature').describe('GeoJSON type identifier'),
    geometry: geometrySchema.describe('GeoJSON geometry object'),
    id: z.optional(z.union([z.string(), z.number()])).describe('Optional feature identifier'),
    properties: z.any().describe('Feature properties'),
    bbox: z.optional(z.array(z.number())).describe('Bounding box [minLng, minLat, maxLng, maxLat]'),
});

/**
 * @ignore
 */
export const featureCollectionSchema = z.object({
    type: z.literal('FeatureCollection').describe('GeoJSON type identifier'),
    features: z.array(featureSchema).describe('Array of GeoJSON features'),
    id: z.optional(z.union([z.string(), z.number()])).describe('Optional collection identifier'),
    properties: z.any().describe('Collection properties'),
    bbox: z.optional(z.array(z.number())).describe('Bounding box [minLng, minLat, maxLng, maxLat]'),
});

/**
 * @ignore
 */
export const hasLngLatSchema = z
    .union([
        z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
        z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90), z.number()]),
        z.object({
            type: z.literal('Point'),
            coordinates: z.array(z.number()),
        }),
        featureSchema,
    ])
    .describe('Geographic position as [longitude, latitude] tuple, Point geometry, or Feature');

/**
 * @ignore
 */
const geoJsonbBoxSchema = z
    .union([
        z.array(z.number()).refine((arr) => arr.length === 4, { message: 'BBox must have 4 elements' }),
        z.array(z.number()).refine((arr) => arr.length === 6, { message: 'BBox must have 6 elements' }),
    ])
    .describe(
        'GeoJSON bounding box array [minLng, minLat, maxLng, maxLat] or [minLng, minLat, minAlt, maxLng, maxLat, maxAlt]',
    );

/**
 * @ignore
 */
export const geoJSONObjectSchema = z
    .union([geometrySchema, featureSchema, featureCollectionSchema])
    .describe('Any GeoJSON object (Geometry, Feature, or FeatureCollection)');

/**
 * @ignore
 */
export const hasBBoxSchema = z
    .union([geoJsonbBoxSchema, geoJSONObjectSchema, z.array(geoJSONObjectSchema)])
    .describe('Bounding box as array, GeoJSON object, or array of GeoJSON objects');
