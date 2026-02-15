import { avoidableTypes } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { routeTypes } from '../types/commonRoutingParams';
import { vehicleParametersSchema } from './vehicleParamsSchema';

/**
 * @ignore
 */
export const commonRoutingRequestSchema = z.object({
    costModel: z
        .object({
            avoid: z.array(z.enum(avoidableTypes)).optional(),
            traffic: z.enum(['live', 'historical']).optional(),
            routeType: z.enum(routeTypes).optional(),
            thrillingParams: z
                .object({
                    hilliness: z.enum(['low', 'normal', 'high']).optional(),
                    windingness: z.enum(['low', 'normal', 'high']).optional(),
                })
                .optional(),
        })
        .optional(),
    travelMode: z.string().optional(),
    vehicle: vehicleParametersSchema.optional(),
    when: z
        .object({
            option: z.enum(['departAt', 'arriveBy']),
            date: z.date(),
        })
        .optional(),
});
