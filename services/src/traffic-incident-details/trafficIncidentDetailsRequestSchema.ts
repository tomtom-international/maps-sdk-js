import { trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';
import { hasBBoxSchema } from '../shared/schema/geometriesSchema';

/**
 * @ignore
 */
export const trafficIncidentDetailsRequestSchema = commonServiceRequestSchema
    .extend({
        bbox: hasBBoxSchema.optional(),
        ids: z.array(z.string()).optional(),
        trafficModelId: z.string().optional(),
        categoryFilter: z.array(z.enum([...trafficIncidentRequestCategories])).optional(),
        timeValidityFilter: z.array(z.enum(['present', 'future'])).optional(),
    })
    .refine((data) => !(data.bbox && data.ids), {
        message: 'Provide either bbox or ids, not both',
    });
