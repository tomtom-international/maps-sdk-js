import { trafficIncidentCategories } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';
import { hasBBoxSchema } from '../shared/schema/geometriesSchema';

/**
 * @ignore
 */
export const trafficIncidentDetailsRequestSchema = commonServiceRequestSchema
    .extend({
        bbox: hasBBoxSchema.optional(),
        ids: z.array(z.string()).optional().describe('List of incident IDs'),
        trafficModelId: z.string().optional().describe('Traffic Model ID for temporal consistency'),
        categoryFilter: z
            .array(z.enum([...trafficIncidentCategories]))
            .optional()
            .describe('Incident category filter'),
        timeValidityFilter: z
            .array(z.enum(['present', 'future']))
            .optional()
            .describe('Time validity filter'),
    })
    .refine((data) => !(data.bbox && data.ids), {
        message: 'Provide either bbox or ids, not both',
    });
