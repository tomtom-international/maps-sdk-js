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
            avoid: z
                .array(z.enum(avoidableTypes))
                .optional()
                .describe('Road types and features to avoid when calculating route'),
            traffic: z
                .enum(['live', 'historical'])
                .optional()
                .describe(
                    'Traffic consideration mode (live: real-time + historical, historical: typical patterns only)',
                ),
            routeType: z
                .enum(routeTypes)
                .optional()
                .describe('Route optimization strategy (fast, short, efficient, thrilling)'),
            thrillingParams: z
                .object({
                    hilliness: z
                        .enum(['low', 'normal', 'high'])
                        .optional()
                        .describe('Level of hilliness for thrilling routes'),
                    windingness: z
                        .enum(['low', 'normal', 'high'])
                        .optional()
                        .describe('Level of windingness for thrilling routes'),
                })
                .optional()
                .describe('Optional parameters for thrilling route type'),
        })
        .optional()
        .describe('Cost model criteria for route optimization'),
    travelMode: z.string().optional().describe('Travel mode (car, truck, pedestrian, bicycle)'),
    vehicle: vehicleParametersSchema
        .optional()
        .describe('Vehicle-specific parameters including dimensions, engine type, and consumption model'),
    when: z
        .object({
            option: z.enum(['departAt', 'arriveBy']).describe('Whether to specify a departure or arrival time'),
            date: z.date().describe('The date and time to depart or arrive'),
        })
        .optional()
        .describe('Departure or arrival time specification for route planning'),
});
