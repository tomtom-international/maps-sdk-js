import { z } from 'zod/v4-mini';
import { commonRoutingRequestSchema } from '../shared/commonRoutingRequestSchema';
import { hasLngLatSchema } from '../shared/geometriesSchema';
import { budgetTypes } from './types/reachableRangeParams';

// import { SchemaRefinement } from "../shared/types/validation";

const reachableRangeRequestSchemaMandatory = z.object({
    origin: hasLngLatSchema,
    budget: z.object({
        type: z.enum(budgetTypes),
        value: z.number().check(z.minimum(0)),
    }),
});

const reachableRangeRequestSchemaOptional = z.object({
    maxFerryLengthMeters: z.optional(z.number().check(z.minimum(0))),
});

const reachableRangeRequestSchema = z.extend(
    commonRoutingRequestSchema,
    z.extend(reachableRangeRequestSchemaMandatory, reachableRangeRequestSchemaOptional.shape).shape,
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
