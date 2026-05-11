import { z } from 'zod';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { commonGeocodeAndFuzzySearchParamsSchema } from '../shared/schema/commonGeocodeAndFuzzySearchParamsSchema';
import type { SchemaRefinement } from '../shared/types/validation';
import type { ExplorationSearchParams } from './types';

const positionSchema = z.array(z.number()).min(2);

const polygonSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
    bbox: z.array(z.number()).optional(),
});

const multiPolygonSchema = z.object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(z.array(z.array(z.array(z.number())))),
    bbox: z.array(z.number()).optional(),
});

const circleSchema = z.object({
    type: z.literal('Circle'),
    coordinates: positionSchema,
    radius: z.number().positive(),
});

const polygonFeaturesSchema = z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(
        z.object({
            type: z.literal('Feature'),
            geometry: z.union([polygonSchema, multiPolygonSchema]),
            properties: z.any().optional(),
        }),
    ),
});

const geometryInputSchema = z.union([polygonSchema, multiPolygonSchema, circleSchema, polygonFeaturesSchema]);

const bboxTupleSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const hasBBoxObjectSchema = z.object({ bbox: bboxTupleSchema });

const hasBBoxSchema = z.union([bboxTupleSchema, hasBBoxObjectSchema]);

// The places-api accepts from + size ≤ 10000 (OpenSearch's `index.max_result_window`),
// so the exploration-search pagination bounds are wider than the generic TomTom search cap.
const PLACES_API_MAX_WINDOW = 10000;

const recordTypeSchema = z.enum(['POI', 'PointAddress', 'Street']);

const explorationSearchRequestOptional = z.object({
    municipalities: z.array(z.string()).optional(),
    boundingBoxes: z.array(hasBBoxSchema).optional(),
    geometries: z.array(geometryInputSchema).optional(),
    placeTypes: z.array(recordTypeSchema).min(1).optional(),
    offset: z.number().int().min(0).max(PLACES_API_MAX_WINDOW).optional(),
    limit: z.number().int().min(1).max(PLACES_API_MAX_WINDOW).optional(),
});

/**
 * @ignore
 */
export const explorationSearchRequestSchema = commonSearchParamsSchema.extend(
    commonGeocodeAndFuzzySearchParamsSchema.extend(explorationSearchRequestOptional.shape).shape,
);

// The places-api rejects fully unbiased searches (they fan out across the whole index),
// so the SDK mirrors that contract by requiring at least one geographic filter.
// `municipalities` is accepted as a standalone bias — the API treats an exact
// municipality match as a hard spatial filter, no bbox/position needed.
const geoBiasRefinement: SchemaRefinement<ExplorationSearchParams> = {
    check: (data) =>
        !!data.position ||
        !!data.boundingBox ||
        !!data.boundingBoxes?.length ||
        !!data.geometries?.length ||
        !!data.municipalities?.length,
    message: 'A geographic bias is required: provide one of position, boundingBox(es), geometries, or municipalities.',
};

/**
 * @ignore
 */
export const explorationSearchRequestValidationConfig = {
    schema: explorationSearchRequestSchema,
    refinements: [geoBiasRefinement],
};
