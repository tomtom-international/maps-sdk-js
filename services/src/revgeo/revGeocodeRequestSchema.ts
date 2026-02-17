import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

const revGeocodeRequestMandatory = z.object({
    position: hasLngLatSchema.describe('Geographic position [longitude, latitude] to reverse geocode'),
});

const revGeocodeRequestOptional = z.object({
    allowFreeformNewline: z.boolean().optional().describe('Allow newline characters in freeform address'),
    geographyType: z.array(z.string()).optional().describe('Filter results to specific geography types'),
    heading: z
        .number()
        .min(-360)
        .max(360)
        .optional()
        .describe('Vehicle heading in degrees (-360 to 360) for directional results'),
    mapcodes: z.array(z.string()).optional().describe('Request mapcode representations for location'),
    number: z.string().optional().describe('Street number for more precise address results'),
    radiusMeters: z.number().optional().describe('Search radius in meters for reverse geocoding'),
    returnMatchType: z.boolean().optional().describe('Include match type information in response'),
    returnRoadUse: z.boolean().optional().describe('Include road use information in response'),
    returnSpeedLimit: z.boolean().optional().describe('Include speed limit information in response'),
    roadUses: z.array(z.string()).optional().describe('Filter results to specific road use types'),
    view: z.enum(views).optional().describe('Geopolitical view for disputed territories'),
});

/**
 * @ignore
 */
export const revGeocodeRequestSchema = revGeocodeRequestMandatory.extend(revGeocodeRequestOptional.shape);
