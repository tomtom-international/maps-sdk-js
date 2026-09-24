import { z } from 'zod';
import { hasBBoxSchema, hasLngLatSchema } from './geometriesSchema';

/** The point arm on its own, for the endpoints that bias by point only. @ignore */
export const pointGeoBiasSchema = z.object({
    position: hasLngLatSchema,
    radiusMeters: z.number().optional(),
});

/** @ignore */
export const geoBiasSchema = z.union([pointGeoBiasSchema, z.object({ boundingBox: hasBBoxSchema })]);
