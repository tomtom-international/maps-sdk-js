import { z } from 'zod';
import { commonSearchParamsSchema } from '../search/commonSearchParamsSchema';
import { lineStringCoordsSchema } from '../shared/schema/geometriesSchema';

const lineStringSchema = z.object({
    type: z.literal('LineString'),
    coordinates: lineStringCoordsSchema,
});

const routeFeatureSchema = z.object({
    type: z.literal('Feature'),
    geometry: lineStringSchema,
});

const positionsArraySchema = lineStringCoordsSchema;

const routeSchema = z.union([lineStringSchema, routeFeatureSchema, positionsArraySchema]);

const alongRouteSearchRequestMandatory = z.object({
    route: routeSchema.describe('GeoJSON LineString or Route Feature to search along'),
    maxDetourTimeSeconds: z.number().int().positive().describe('Maximum allowed detour time in seconds'),
});

const alongRouteSearchRequestOptional = z.object({
    sortBy: z
        .enum(['detourTime', 'detourOffset'])
        .optional()
        .describe('Sort results by detour time or position along the route'),
});

/**
 * @ignore
 */
export const alongRouteSearchRequestSchema = commonSearchParamsSchema.extend({
    ...alongRouteSearchRequestMandatory.shape,
    ...alongRouteSearchRequestOptional.shape,
});
