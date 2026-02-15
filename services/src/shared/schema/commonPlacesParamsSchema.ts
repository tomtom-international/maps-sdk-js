import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { hasLngLatSchema } from './geometriesSchema';

const placesParamsMandatory = z.object({
    query: z.string(),
});

const placesParamsOptional = z.object({
    position: hasLngLatSchema.optional(),
    limit: z.number().max(100).optional(),
    extendedPostalCodesFor: z.array(z.string()).optional(),
    mapcodes: z.array(z.string()).optional(),
    view: z.enum(views).optional(),
    geographyTypes: z.array(z.string()).optional(),
});

/**
 * @ignore
 */
export const commonPlacesParamsSchema = placesParamsMandatory.extend(placesParamsOptional.shape);
