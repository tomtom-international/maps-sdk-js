import { z } from "zod/v4-mini";

// TODO: Add tests for CalculateMatrixRouteRequestSchema

const positionSchema = z.array(
    z.tuple([z.number().check(z.minimum(-180), z.maximum(180)), z.number().check(z.minimum(-90), z.maximum(90))])
);

const calculateMatrixRouteSchemaMandatory = z.object({
    origins: positionSchema,
    destinations: positionSchema
});

const calculateMatrixRouteSchemaOptional = z.partial(
    z.object({
        departAt: z.union([z.date(), z.literal("any"), z.literal("now")]),
        arriveAt: z.union([z.date(), z.literal("any")]),
        routeType: z.literal("fastest"),
        traffic: z.union([z.literal("historical"), z.literal("live")]),
        travelMode: z.union([z.literal("car"), z.literal("truck"), z.literal("pedestrian")]),
        vehicleMaxSpeed: z.number().check(z.minimum(0), z.maximum(250)),
        vehicleWeight: z.number(),
        vehicleAxleWeight: z.number(),
        vehicleLength: z.number(),
        vehicleWidth: z.number(),
        vehicleHeight: z.number(), // TODO: Reuse/Create VehicleDimensions (needs more clarification)
        vehicleCommercial: z.number(),
        vehicleLoadType: z.array(z.string()).check(
            z.refine((data) => data.length >= 1, {
                message: "Array must contain at least 1 string"
            })
        ),
        vehicleAdrTunnelRestrictionCod: z.string(),
        avoid: z.union([z.literal("tollRoads"), z.literal("unpavedRoads")]).check(
            z.refine((data) => data.length >= 1, {
                message: "Array must contain at least 1 string"
            })
        )
    })
);

const calculateMatrixRouteSchema = z.extend(
    calculateMatrixRouteSchemaMandatory,
    calculateMatrixRouteSchemaOptional
).shape;

/**
 * @ignore
 */
export const matrixRouteValidationConfig = {
    schema: calculateMatrixRouteSchema
};
