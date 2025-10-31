import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod/v4-mini';
import { hasLngLatSchema } from './geometriesSchema';

const placesParamsMandatory = z.object({
    query: z.string(),
});

const placesParamsOptional = z.partial(
    z.object({
        position: hasLngLatSchema,
        limit: z.number().check(z.maximum(100)),
        extendedPostalCodesFor: z.array(z.string()),
        mapcodes: z.array(z.string()),
        view: z.enum(views),
        geographyTypes: z.array(z.string()),
    }),
);

/**
 * @ignore
 */
export const commonPlacesParamsSchema = z.extend(placesParamsMandatory, placesParamsOptional.shape);
