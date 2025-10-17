import { avoidableTypes } from '@cet/maps-sdk-js/core';
import { z } from 'zod/v4-mini';
import { routeTypes } from './types/commonRoutingParams';
import { vehicleParametersSchema } from './vehicleParamsSchema';

/**
 * @ignore
 */
export const commonRoutingRequestSchema = z.partial(
    z.object({
        costModel: z.partial(
            z.object({
                avoid: z.array(z.enum(avoidableTypes)),
                traffic: z.optional(z.enum(['live', 'historical'])),
                routeType: z.optional(z.enum(routeTypes)),
                thrillingParams: z.optional(
                    z.object({
                        hilliness: z.optional(z.enum(['low', 'normal', 'high'])),
                        windingness: z.optional(z.enum(['low', 'normal', 'high'])),
                    }),
                ),
            }),
        ),
        travelMode: z.string(),
        vehicle: vehicleParametersSchema,
        when: z.object({
            option: z.enum(['departAt', 'arriveBy']),
            date: z.date(),
        }),
    }),
);
