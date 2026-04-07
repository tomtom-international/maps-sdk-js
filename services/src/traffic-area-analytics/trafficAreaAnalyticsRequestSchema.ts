import { areaAnalyticsMetricKeys } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { commonServiceRequestSchema } from '../shared/schema/commonParamsSchema';
import { functionalRoadClasses } from './types/trafficAreaAnalyticsParams';

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

const startOfDayUTC = (d: Date | string): number => {
    const date = toDateObj(d);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const isAtLeastTwoDaysBeforeToday = (d: Date | string): boolean => {
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return startOfDayUTC(d) <= todayUTC - 2 * ONE_DAY_MS;
};

/**
 * @ignore
 */
export const trafficAreaAnalyticsRequestSchema = commonServiceRequestSchema
    .extend({
        name: z.string().optional(),
        startDate: dateInputSchema.optional(),
        endDate: dateInputSchema.optional(),
        days: z.array(dateInputSchema).min(1).optional(),
        metrics: z.union([z.array(z.enum([...areaAnalyticsMetricKeys])).min(1), z.literal('all')]),
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

            // Validate range for continuous range: startDate must be at least 1 day before endDate, within 31 days
            if (data.startDate !== undefined) {
                const effectiveEnd = data.endDate !== undefined ? toDateObj(data.endDate) : new Date();
                const diffDays = (effectiveEnd.getTime() - toDateObj(data.startDate).getTime()) / (1000 * 60 * 60 * 24);
                return diffDays >= 1 && diffDays <= 31;
            }

            return true;
        },
        {
            message:
                'Provide either startDate (with optional endDate, at least 1 day apart and within 31 days) or days — but not both',
        },
    )
    .refine(
        (data) => {
            if (data.days !== undefined) {
                return data.days.every(isAtLeastTwoDaysBeforeToday);
            }

            const effectiveEnd = data.endDate ?? new Date();
            return isAtLeastTwoDaysBeforeToday(effectiveEnd);
        },
        {
            message: 'Dates must be at least 2 days before today',
        },
    );
