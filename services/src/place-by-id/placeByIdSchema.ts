import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';

const placeByIdRequestMandatory = z.object({
    entityId: z.string().describe('Unique identifier of the place/entity to retrieve'),
});

const placeByIdRequestOptional = z.object({
    mapcodes: z.array(z.string()).optional().describe('Request mapcode representations for location'),
    view: z.enum(views).optional().describe('Geopolitical view for disputed territories'),
    openingHours: z.string().optional().describe('Request opening hours information for the place'),
    timeZone: z.string().optional().describe('Request timezone information for the place location'),
    relatedPois: z.string().optional().describe('Related POI inclusion mode (off, child, parent, all)'),
});

/**
 * @ignore
 */
export const placeByIdRequestSchema = placeByIdRequestMandatory.extend(placeByIdRequestOptional.shape);
