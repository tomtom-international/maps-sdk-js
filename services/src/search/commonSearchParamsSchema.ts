import { poiCategories } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonPlacesParamsSchema } from '../shared/schema/commonPlacesParamsSchema';

const searchExtraParamsOptional = z.object({
    indexes: z.array(z.string()).optional().describe('Search indexes to query (Geo, PAD, Addr, Str, XStr, POI)'),
    poiCategories: z.array(z.enum(poiCategories)).optional().describe('Filter results to specific POI categories'),
    poiBrands: z.array(z.string()).optional().describe('Filter results to specific POI brands'),
    connectors: z.array(z.string()).optional().describe('Filter EV charging stations by connector types'),
    fuelTypes: z.array(z.string()).optional().describe('Filter fuel stations by available fuel types'),
    openingHours: z.string().optional().describe('Request opening hours information for POIs'),
    timeZone: z.string().optional().describe('Request timezone information for POI locations (iana)'),
    relatedPois: z.string().optional().describe('Related POI inclusion mode (off, child, parent, all)'),
    minPowerKW: z.number().optional().describe('Minimum charging power in kilowatts for EV charging stations'),
    maxPowerKW: z.number().optional().describe('Maximum charging power in kilowatts for EV charging stations'),
    minFuzzyLevel: z.number().optional().describe('Minimum fuzzy matching level (1-4)'),
    mixFuzzyLevel: z.number().optional().describe('Maximum fuzzy matching level (1-4)'),
});

/**
 * @ignore
 */
export const commonSearchParamsSchema = commonPlacesParamsSchema.extend(searchExtraParamsOptional.shape);
