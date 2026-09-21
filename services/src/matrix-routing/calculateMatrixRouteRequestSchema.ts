import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

// This schema described a shape `CalculateMatrixRouteParams` does not have: every option flat at the
// top level, where the type nests them under `options`. So none of them were ever validated, and the
// two the type spells differently -- `vehicleCommercial` as a number, `avoid` as a single value --
// rejected every value a caller could legally pass. It now mirrors the params type.
const matrixRouteOptionsSchema = z.object({
    departAt: z.union([z.date(), z.literal(['any', 'now'])]).optional(),
    arriveAt: z.union([z.date(), z.literal('any')]).optional(),
    routeType: z.literal('fastest').optional(),
    traffic: z.enum(['historical', 'live']).optional(),
    travelMode: z.enum(['car', 'truck', 'pedestrian']).optional(),
    vehicleWeight: z.number().optional(),
    vehicleLength: z.number().optional(),
    vehicleHeight: z.number().optional(),
    vehicleWidth: z.number().optional(),
    vehicleAxleWeight: z.number().optional(),
    vehicleMaxSpeed: z.number().min(0).max(250).optional(),
    vehicleCommercial: z.boolean().optional(),
    avoid: z.array(z.enum(['tollRoads', 'unpavedRoads'])).optional(),
});

const calculateMatrixRouteSchemaMandatory = z.object({
    // `HasLngLat`, not a bare `[lng, lat]` tuple: the type and the docs both accept a GeoJSON Point
    // or Point feature here, and the tuple-only schema rejected them.
    origins: z.array(hasLngLatSchema),
    destinations: z.array(hasLngLatSchema),
});

const calculateMatrixRouteSchemaOptional = z.object({
    options: matrixRouteOptionsSchema.optional(),
});

const calculateMatrixRouteSchema = calculateMatrixRouteSchemaMandatory.extend(calculateMatrixRouteSchemaOptional.shape);

/**
 * @ignore
 */
export const matrixRouteValidationConfig = {
    schema: calculateMatrixRouteSchema,
};
