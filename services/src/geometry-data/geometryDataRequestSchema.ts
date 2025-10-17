import { z } from 'zod/v4-mini';
import { featureCollectionSchema, featureSchema } from '../shared/schema/geometriesSchema';

const geometryDataRequestMandatory = z.object({
    geometries: z.union([
        featureCollectionSchema,
        z.array(z.union([z.string(), featureSchema])).check(z.minLength(1), z.maxLength(20)),
    ]),
});

const geometryDataRequestOptional = z.partial(
    z.object({
        zoom: z.number().check(z.minimum(0), z.maximum(22)),
    }),
);

export const geometryDataRequestSchema = z.extend(geometryDataRequestMandatory, geometryDataRequestOptional.shape);
