import { avoidableTypes } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonRoutingRequestSchema } from '../shared/schema/commonRoutingRequestSchema';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';
import { vehicleParametersSchema } from '../shared/schema/vehicleParamsSchema';
import { routeTypes } from '../shared/types/commonRoutingParams';
import { budgetTypes } from './types/reachableRangeParams';

// import { SchemaRefinement } from "../shared/types/validation";

const reachableRangeRequestSchemaMandatory = z.object({
    origin: hasLngLatSchema,
    budget: z.object({
        type: z.enum(budgetTypes),
        value: z.number().min(0),
    }),
});

// Narrower than `commonRoutingRequestSchema.costModel`: the endpoint rejects
// `avoid=alreadyUsedRoads` outright, and has no avoid-areas parameter at all.
const reachableRangeAvoidableSchema = z.enum(avoidableTypes).exclude(['alreadyUsedRoads']);

// Matches `ReachableRangeVehicleParameters`: the endpoint answers `400 parameter [x] not
// supported` to both of these, so they fail validation here rather than being quietly dropped for
// callers who are not type-checked. Charging preferences encode to `minChargeAt*InkWh`, which only
// the charging-stops endpoint takes — this one plans no stops.
const reachableRangeVehicleSchema = vehicleParametersSchema.check(
    z.refine(
        (vehicle) => !(vehicle.state && 'heading' in vehicle.state),
        'vehicle.state.heading: calculateReachableRange has no vehicle heading parameter',
    ),
    z.refine(
        (vehicle) => !(vehicle.preferences && 'chargingPreferences' in vehicle.preferences),
        'vehicle.preferences.chargingPreferences: calculateReachableRange plans no charging stops',
    ),
);

const reachableRangeRequestSchemaOptional = z.object({
    vehicle: reachableRangeVehicleSchema.optional(),
    costModel: z
        .object({
            avoid: z.array(reachableRangeAvoidableSchema).optional(),
            traffic: z.enum(['live', 'historical']).optional(),
            routeType: z.enum(routeTypes).optional(),
        })
        .optional(),
    maxFerryLengthMeters: z.number().min(0).optional(),
    smoothing: z.enum(['none', 'weak', 'strong']).optional(),
});

const reachableRangeRequestSchema = commonRoutingRequestSchema.extend(
    reachableRangeRequestSchemaMandatory.extend(reachableRangeRequestSchemaOptional.shape).shape,
);

// const departArriveRefinement: SchemaRefinement<ReachableRangeParams> = {
//     check: (data: ReachableRangeParams): boolean => (data.when?.option as string) != "arriveBy",
//     message: "When calculating a reachable range, departure date-time can be specified, but not arrival date-time"
// };

// const evRangeRefinement: SchemaRefinement<ReachableRangeParams> = {
//     check: (data: ReachableRangeParams): boolean =>
//         !(
//             (data.budget.type === "remainingChargeCPT" || data.budget.type === "spentChargePCT") &&
//             data.vehicle?.engine?.type != "electric"
//         ),
//     message: "With an EV reachable range, the vehicle parameters must be set, with 'electric' engine type"
// };
//
// const fuelRangeRefinement: SchemaRefinement<ReachableRangeParams> = {
//     check: (data: ReachableRangeParams): boolean =>
//         !(data.budget.type === "spentFuelLiters" && data.vehicle?.engine?.type != "combustion"),
//     message: "With a fuel reachable range, the vehicle parameters must be set, with 'combustion' engine type"
// };

/**
 * @ignore
 */
export const reachableRangeRequestValidationConfig = {
    schema: reachableRangeRequestSchema,
    // refinements: [evRangeRefinement, fuelRangeRefinement, departArriveRefinement]
};
