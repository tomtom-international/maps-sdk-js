import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

const revGeocodeRequestMandatory = z.object({
    position: hasLngLatSchema,
});

const revGeocodeRequestOptional = z.object({
    allowFreeformNewline: z.boolean().optional(),
    geographyType: z.array(z.string()).optional(),
    heading: z.number().min(-360).max(360).optional(),
    mapcodes: z.array(z.string()).optional(),
    number: z.string().optional(),
    radiusMeters: z.number().optional(),
    returnMatchType: z.boolean().optional(),
    returnRoadUse: z.boolean().optional(),
    returnSpeedLimit: z.boolean().optional(),
    roadUses: z.array(z.string()).optional(),
    view: z.enum(views).optional(),
});

/**
 * @ignore
 */
export const revGeocodeRequestSchema = revGeocodeRequestMandatory.extend(revGeocodeRequestOptional.shape);
