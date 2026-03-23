import { z } from 'zod';
import { featureCollectionSchema, featureSchema } from '../shared/schema/geometriesSchema';

const geometryDataRequestMandatory = z.object({
    geometries: z.union([
        featureCollectionSchema,
        z
            .array(z.union([z.string(), featureSchema]))
            .min(1)
            .max(20),
    ]),
});

const geometryDataRequestOptional = z.object({
    zoom: z.number().min(0).max(22).optional(),
});

export const geometryDataRequestSchema = geometryDataRequestMandatory.extend(geometryDataRequestOptional.shape);
