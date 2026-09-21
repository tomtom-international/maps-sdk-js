import { geographyTypes, views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { hasLngLatSchema } from '../shared/schema/geometriesSchema';

const revGeocodeRequestMandatory = z.object({
    position: hasLngLatSchema,
});

const revGeocodeRequestOptional = z.object({
    geographyType: z.array(z.enum(geographyTypes)).optional(),
    heading: z.number().min(-360).max(360).optional(),
    radiusMeters: z.number().positive().max(5_000_000).optional(),
    view: z.enum(views).optional(),
});

/**
 * @ignore
 */
export const revGeocodeRequestSchema = revGeocodeRequestMandatory.extend(revGeocodeRequestOptional.shape);
