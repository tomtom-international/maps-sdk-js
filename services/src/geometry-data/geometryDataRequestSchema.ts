import { z } from 'zod';
import { featureCollectionSchema, featureSchema } from '../shared/schema/geometriesSchema';

const geometryDataRequestMandatory = z.object({
    geometries: z
        .union([
            featureCollectionSchema,
            z
                .array(z.union([z.string(), featureSchema]))
                .min(1)
                .max(20),
        ])
        .describe('GeoJSON FeatureCollection or array of geometry IDs/Features (max 20)'),
});

const geometryDataRequestOptional = z.object({
    zoom: z.number().min(0).max(22).optional().describe('Zoom level for geometry data simplification (0-22)'),
});

export const geometryDataRequestSchema = geometryDataRequestMandatory.extend(geometryDataRequestOptional.shape);
