import { poiCategories } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonPlacesParamsSchema } from '../shared/schema/commonPlacesParamsSchema';

const searchExtraParamsOptional = z.object({
    indexes: z.array(z.string()).optional(),
    poiCategories: z.array(z.enum(poiCategories)).optional(),
    poiBrands: z.array(z.string()).optional(),
    connectors: z.array(z.string()).optional(),
    fuelTypes: z.array(z.string()).optional(),
    openingHours: z.string().optional(),
    timeZone: z.string().optional(),
    relatedPois: z.string().optional(),
    minPowerKW: z.number().optional(),
    maxPowerKW: z.number().optional(),
    minFuzzyLevel: z.number().optional(),
    maxFuzzyLevel: z.number().optional(),
});

/**
 * @ignore
 */
export const commonSearchParamsSchema = commonPlacesParamsSchema.extend(searchExtraParamsOptional.shape);
