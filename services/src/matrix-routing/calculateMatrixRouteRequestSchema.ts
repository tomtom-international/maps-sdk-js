import { z } from "zod";

const positionSchema = z.array(z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]));

const calculateMatrixRouteSchemaMandatory = z.object({
    origins: positionSchema,
    destinations: positionSchema
});

const calculateMatrixRouteSchemaOptional = z
    .object({
        departAt: z.union([z.date(), z.literal("any"), z.literal("now")]),
        arriveAt: z.union([z.date(), z.literal("any")]),
        routeType: z.literal("fastest"),
        traffic: z.union([z.literal("historical"), z.literal("live")]),
        travelMode: z.union([z.literal("car"), z.literal("truck"), z.literal("pedestrian")]),
        vehicleMaxSpeed: z.number().min(0).max(250),
        vehicleWeight: z.number(),
        vehicleAxleWeight: z.number(),
        vehicleLength: z.number(),
        vehicleWidth: z.number(),
        vehicleHeight: z.number(),
        vehicleCommercial: z.number(),
        vehicleLoadType: z.array(z.string()).refine((data) => data.length >= 1, {
            message: "Array must contain at least 1 string"
        }),
        vehicleAdrTunnelRestrictionCod: z.string(),
        avoid: z.array(z.literal("tollRoads"), z.literal("unpavedRoads")).refine((data) => data.length >= 1, {
            message: "Array must contain at least 1 string"
        })
    })
    .partial();

const calculateMatrixRouteSchema = calculateMatrixRouteSchemaMandatory.merge(calculateMatrixRouteSchemaOptional);

/**
 * @ignore
 */
export const matrixRouteValidationConfig = {
    schema: calculateMatrixRouteSchema
};
