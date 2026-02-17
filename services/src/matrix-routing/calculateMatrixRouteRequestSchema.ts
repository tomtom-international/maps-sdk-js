import { z } from 'zod';

// TODO: Add tests for CalculateMatrixRouteRequestSchema

const positionSchema = z
    .array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]))
    .describe('Array of [longitude, latitude] coordinate pairs');

const calculateMatrixRouteSchemaMandatory = z.object({
    origins: positionSchema.describe('Array of origin positions [longitude, latitude]'),
    destinations: positionSchema.describe('Array of destination positions [longitude, latitude]'),
});

const calculateMatrixRouteSchemaOptional = z.object({
    departAt: z
        .union([z.date(), z.literal('any'), z.literal('now')])
        .optional()
        .describe('Departure time as Date, "now", or "any"'),
    arriveAt: z
        .union([z.date(), z.literal('any')])
        .optional()
        .describe('Arrival time as Date or "any"'),
    routeType: z
        .literal('fastest')
        .optional()
        .describe('Route optimization type (currently only "fastest" is supported)'),
    traffic: z
        .union([z.literal('historical'), z.literal('live')])
        .optional()
        .describe('Traffic consideration mode (live: real-time, historical: typical patterns)'),
    travelMode: z
        .union([z.literal('car'), z.literal('truck'), z.literal('pedestrian')])
        .optional()
        .describe('Travel mode for route calculation'),
    vehicleMaxSpeed: z.number().min(0).max(250).optional().describe('Maximum vehicle speed in km/h (0-250)'),
    vehicleWeight: z.number().optional().describe('Vehicle weight in kilograms'),
    vehicleAxleWeight: z.number().optional().describe('Vehicle axle weight in kilograms'),
    vehicleLength: z.number().optional().describe('Vehicle length in meters'),
    vehicleWidth: z.number().optional().describe('Vehicle width in meters'),
    vehicleHeight: z.number().optional().describe('Vehicle height in meters'),
    vehicleCommercial: z.number().optional().describe('Whether vehicle is used for commercial purposes'),
    vehicleLoadType: z
        .array(z.string())
        .min(1)
        .optional()
        .describe('Types of hazardous or restricted loads being carried'),
    vehicleAdrTunnelRestrictionCod: z
        .string()
        .optional()
        .describe('ADR tunnel restriction code for hazardous materials'),
    avoid: z
        .union([z.literal('tollRoads'), z.literal('unpavedRoads')])
        .optional()
        .describe('Road types to avoid when calculating routes'),
});

const calculateMatrixRouteSchema = calculateMatrixRouteSchemaMandatory.extend(calculateMatrixRouteSchemaOptional.shape);

/**
 * @ignore
 */
export const matrixRouteValidationConfig = {
    schema: calculateMatrixRouteSchema,
};
