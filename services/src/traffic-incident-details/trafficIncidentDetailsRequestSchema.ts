import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';

/**
 * @ignore
 */
export const trafficIncidentDetailsRequestSchema = commonServiceRequestSchema
    .extend({
        bbox: z
            .tuple([z.number(), z.number(), z.number(), z.number()])
            .optional()
            .describe('Bounding box [minLon, minLat, maxLon, maxLat]'),
        ids: z.array(z.string()).optional().describe('List of incident IDs'),
        trafficModelId: z.string().optional().describe('Traffic Model ID for temporal consistency'),
        categoryFilter: z.array(z.number()).optional().describe('Incident category integer filter'),
        timeValidityFilter: z
            .array(z.enum(['present', 'future']))
            .optional()
            .describe('Time validity filter'),
    })
    .refine((data) => !(data.bbox && data.ids), {
        message: 'Provide either bbox or ids, not both',
    });
