import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';

const placeByIdRequestMandatory = z.object({
    entityId: z.string(),
});

const placeByIdRequestOptional = z.object({
    mapcodes: z.array(z.string()).optional(),
    view: z.enum(views).optional(),
    openingHours: z.string().optional(),
    timeZone: z.string().optional(),
    relatedPois: z.string().optional(),
});

/**
 * @ignore
 */
export const placeByIdRequestSchema = placeByIdRequestMandatory.extend(placeByIdRequestOptional.shape);
