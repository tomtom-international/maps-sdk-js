import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';
import { areaAnalyticsDataTypes, functionalRoadClasses } from './types/trafficAreaAnalyticsParams';

const dateInputSchema = z.union([
    z.date(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in 'YYYY-MM-DD' format"),
]);

const geometrySchema = z.union([
    z.object({
        type: z.literal('Polygon'),
        coordinates: z.array(z.array(z.array(z.number()))).min(1),
    }),
    z.object({
        type: z.literal('MultiPolygon'),
        coordinates: z.array(z.array(z.array(z.array(z.number())))).min(1),
    }),
]);

const toDateObj = (d: Date | string): Date => (d instanceof Date ? d : new Date(d));

/**
 * @ignore
 */
export const trafficAreaAnalyticsRequestSchema = commonServiceRequestSchema
    .extend({
        name: z.string().optional(),
        startDate: dateInputSchema.optional(),
        endDate: dateInputSchema.optional(),
        days: z.array(dateInputSchema).min(1).optional(),
        dataTypes: z.array(z.enum([...areaAnalyticsDataTypes])).min(1),
        functionalRoadClasses: z.union([z.array(z.enum([...functionalRoadClasses])).min(1), z.literal('all')]),
        hours: z.union([z.array(z.number().int().min(0).max(23)).min(1), z.literal('all')]),
        geometry: geometrySchema,
    })
    .refine(
        (data) => {
            const hasDays = data.days !== undefined;
            const hasStart = data.startDate !== undefined;

            // Exactly one mode: either days OR startDate (+optional endDate)
            if (hasDays && hasStart) return false;
            if (!hasDays && !hasStart) return false;

            // Validate 31-day constraint for continuous range
            if (data.startDate !== undefined) {
                const effectiveEnd = data.endDate !== undefined ? toDateObj(data.endDate) : new Date();
                const diffDays = (effectiveEnd.getTime() - toDateObj(data.startDate).getTime()) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 31;
            }

            return true;
        },
        {
            message: 'Provide either startDate (with optional endDate, within 31 days) or days — but not both',
        },
    );
