import { views } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { hasLngLatSchema } from './geometriesSchema';

const placesParamsMandatory = z.object({
    query: z.string().describe('Search query for places, addresses, or locations'),
});

const placesParamsOptional = z.object({
    position: hasLngLatSchema.optional().describe('Geographic position [longitude, latitude] to bias search results'),
    limit: z.number().max(100).optional().describe('Maximum number of results to return (1-100)'),
    extendedPostalCodesFor: z
        .array(z.string())
        .optional()
        .describe('Indexes for which to include extended postal codes in results'),
    mapcodes: z
        .array(z.string())
        .optional()
        .describe('Request mapcode representations for locations (Local, International, Alternative)'),
    view: z.enum(views).optional().describe('Geopolitical view for disputed territories'),
    geographyTypes: z
        .array(z.string())
        .optional()
        .describe('Filter results to specific geography types (Country, Municipality, etc.)'),
});

/**
 * @ignore
 */
export const commonPlacesParamsSchema = placesParamsMandatory.extend(placesParamsOptional.shape);
