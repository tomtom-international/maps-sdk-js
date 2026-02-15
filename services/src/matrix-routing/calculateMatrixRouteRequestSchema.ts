import { z } from 'zod';

// TODO: Add tests for CalculateMatrixRouteRequestSchema

const positionSchema = z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]));

const calculateMatrixRouteSchemaMandatory = z.object({
    origins: positionSchema,
    destinations: positionSchema,
});

const calculateMatrixRouteSchemaOptional = z.object({
    departAt: z.union([z.date(), z.literal('any'), z.literal('now')]).optional(),
    arriveAt: z.union([z.date(), z.literal('any')]).optional(),
    routeType: z.literal('fastest').optional(),
    traffic: z.union([z.literal('historical'), z.literal('live')]).optional(),
    travelMode: z.union([z.literal('car'), z.literal('truck'), z.literal('pedestrian')]).optional(),
    vehicleMaxSpeed: z.number().min(0).max(250).optional(),
    vehicleWeight: z.number().optional(),
    vehicleAxleWeight: z.number().optional(),
    vehicleLength: z.number().optional(),
    vehicleWidth: z.number().optional(),
    vehicleHeight: z.number().optional(), // TODO: Reuse/Create VehicleDimensions (needs more clarification)
    vehicleCommercial: z.number().optional(),
    vehicleLoadType: z.array(z.string()).min(1).optional(),
    vehicleAdrTunnelRestrictionCod: z.string().optional(),
    avoid: z.union([z.literal('tollRoads'), z.literal('unpavedRoads')]).optional(),
});

const calculateMatrixRouteSchema = calculateMatrixRouteSchemaMandatory.extend(calculateMatrixRouteSchemaOptional.shape);

/**
 * @ignore
 */
export const matrixRouteValidationConfig = {
    schema: calculateMatrixRouteSchema,
};
