import { z } from 'zod';
import { commonRoutingRequestSchema } from '../shared/schema/commonRoutingRequestSchema';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';
import { budgetTypes } from './types/reachableRangeParams';

// import { SchemaRefinement } from "../shared/types/validation";

const reachableRangeRequestSchemaMandatory = z.object({
    origin: hasLngLatSchema.describe('Starting position [longitude, latitude] for reachable range calculation'),
    budget: z
        .object({
            type: z.enum(budgetTypes).describe('Budget type (time, distance, or energy/fuel)'),
            value: z.number().min(0).describe('Budget value (depends on type: seconds, meters, liters, or kWh)'),
        })
        .describe('Travel budget constraints for reachable range'),
});

const reachableRangeRequestSchemaOptional = z.object({
    maxFerryLengthMeters: z.number().min(0).optional().describe('Maximum ferry distance in meters to include in range'),
    smoothing: z
        .enum(['none', 'weak', 'strong'])
        .optional()
        .describe('Post-processing smoothing level for the polygon boundary'),
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
