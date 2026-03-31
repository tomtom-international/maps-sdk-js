/**
 * @module map-agent-tools
 */

import type { BBox } from '@tomtom-org/maps-sdk/core';
import { trafficIncidentCategories } from '@tomtom-org/maps-sdk/core';
import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-traffic-incidents tool. */
export const getTrafficIncidentsOutputSchema = z.union([
    z.object({
        count: z.number(),
        incidents: z.array(
            z.object({
                id: z.string(),
                category: z.string(),
                magnitudeOfDelay: z.string().describe('unknown|minor|moderate|major|indefinite'),
                timeValidity: z.string().describe('present|future'),
                events: z.array(
                    z.object({
                        description: z.string(),
                        category: z.string(),
                    }),
                ),
                from: z.string().optional(),
                to: z.string().optional(),
                roadNumbers: z.array(z.string()).optional(),
                lengthInMeters: z.number().optional(),
                delayInSeconds: z.number().optional(),
                startTime: z.date().optional(),
                endTime: z.date().optional(),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for fetching traffic incident details.
 */
export const getTrafficIncidentsSchema = z.object({
    bbox: z.optional(z.array(z.number())).describe('[minLng, minLat, maxLng, maxLat]'),
    ids: z.array(z.string()).optional().describe('Up to 100 incident IDs'),
    categoryFilter: z
        .array(z.enum([...trafficIncidentCategories]))
        .optional()
        .describe('Filter by incident category. If omitted, all categories are returned.'),
    timeValidityFilter: z
        .array(z.enum(['present', 'future']))
        .optional()
        .describe("default: ['present']"),
});

export const getTrafficIncidentsDescription =
    'Fetch and analyze traffic incidents (present or future) by bbox or IDs without showing them on the map. Combine with toggleTrafficIncidents to highlight the most important ones in an area, or use getShownIncidents IDs to get full details of what is already rendered. Returns category, severity, delay, and road location.';

/**
 * Create the get traffic incidents tool.
 */
export function createGetTrafficIncidentsTool(_state: ToolState): Tool {
    return tool({
        description: getTrafficIncidentsDescription,
        inputSchema: getTrafficIncidentsSchema,
        outputSchema: getTrafficIncidentsOutputSchema,
        execute: async (params): Promise<z.infer<typeof getTrafficIncidentsOutputSchema>> => {
            const { bbox, ids, categoryFilter, timeValidityFilter } = params;

            if (!bbox && !ids) {
                return { error: 'Provide either a bbox or a list of ids' };
            }

            try {
                const filters = {
                    ...(categoryFilter && { categoryFilter }),
                    ...(timeValidityFilter && { timeValidityFilter }),
                };
                const result = await trafficIncidentDetails(
                    bbox ? { ...filters, bbox: bbox as BBox } : { ...filters, ids: ids as string[] },
                );

                if (!result.features.length) {
                    return { count: 0, incidents: [] };
                }

                return {
                    count: result.features.length,
                    incidents: result.features.map((feature) => {
                        const p = feature.properties;
                        return {
                            id: p.id,
                            category: p.category,
                            magnitudeOfDelay: p.magnitudeOfDelay,
                            timeValidity: p.timeValidity,
                            events: p.events.map((e) => ({ description: e.description, category: e.category })),
                            from: p.from,
                            to: p.to,
                            roadNumbers: p.roadNumbers,
                            lengthInMeters: p.lengthInMeters,
                            delayInSeconds: p.delayInSeconds,
                            startTime: p.startTime,
                            endTime: p.endTime,
                        };
                    }),
                };
            } catch (error) {
                return {
                    error: `Failed to get traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
