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

// When the request omits `size`, the places-api falls back to OpenSearch's default page size of 10,
// so `from` alone still consumes 10 of the window. The refinement uses this to model wire behaviour.
const PLACES_API_DEFAULT_SIZE = 10;

const recordTypeSchema = z.enum(['POI', 'PointAddress', 'Street']);

const explorationSearchRequestOptional = z.object({
    municipalities: z.array(z.string()).optional(),
    boundingBoxes: z.array(hasBBoxSchema).optional(),
    geometries: z.array(geometryInputSchema).optional(),
    placeTypes: z.array(recordTypeSchema).min(1).optional(),
    areaId: z.string().min(1).optional(),
    areaTags: z.array(z.string().min(1)).min(1).optional(),
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
// `municipalities` and `areaId` are accepted as standalone biases — both pin
// the response to a specific municipality polygon, no bbox/position needed.
const geoBiasRefinement: SchemaRefinement<ExplorationSearchParams> = {
    check: (data) =>
        !!data.position ||
        !!data.boundingBox ||
        !!data.boundingBoxes?.length ||
        !!data.geometries?.length ||
        !!data.municipalities?.length ||
        !!data.areaId,
    message:
        'A geographic bias is required: provide one of position, boundingBox(es), geometries, municipalities, or areaId.',
};

// The places-api enforces `from + size ≤ 10000` (OpenSearch's
// `index.max_result_window`). When `limit` is omitted the wire request also omits `size`,
// and the backend falls back to its default page size — so the effective `size` on the
// wire is `limit ?? PLACES_API_DEFAULT_SIZE`, not 0.
const paginationWindowRefinement: SchemaRefinement<ExplorationSearchParams> = {
    check: (data) => (data.offset ?? 0) + (data.limit ?? PLACES_API_DEFAULT_SIZE) <= PLACES_API_MAX_WINDOW,
    message: `offset + limit must not exceed ${PLACES_API_MAX_WINDOW} (the places-api pagination window; when limit is omitted the backend defaults to ${PLACES_API_DEFAULT_SIZE}).`,
};

/**
 * @ignore
 */
export const explorationSearchRequestValidationConfig = {
    schema: explorationSearchRequestSchema,
    refinements: [geoBiasRefinement, paginationWindowRefinement],
};
