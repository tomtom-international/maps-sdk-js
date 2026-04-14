/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-incidents tool. */
export const getShownIncidentsOutputSchema = z.union([
    z.object({
        count: z.number(),
        trafficIncidents: z.array(
            z.object({
                id: z.string(),
                category: z.string(),
                magnitudeOfDelay: z.string().describe('unknown|minor|moderate|major|indefinite'),
                description: z.string().optional(),
                delayInSeconds: z.number().optional(),
                roadCategory: z.string().optional(),
                averageSpeedKmph: z.number().optional(),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting shown traffic incidents on map.
 */
export const getShownIncidentsSchema = z.object({});

export const getShownIncidentsDescription =
    'Get the real-time traffic incidents currently visible in the map viewport (not from service, but what is actually rendered on the map).';

/**
 * Execute get shown incidents.
 */
export const executeGetShownIncidents = async (
    _params: z.infer<typeof getShownIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownIncidentsOutputSchema>> => {
    try {
        const trafficIncidentsModule = await state.traffic.getTrafficIncidentsModule();
        const shown = trafficIncidentsModule.getShown();

        if (shown.trafficIncidents.length === 0) {
            return { error: 'No traffic incidents currently shown on the map' };
        }

        return {
            count: shown.trafficIncidents.length,
            trafficIncidents: shown.trafficIncidents.map((incident) => ({
                id: incident.properties.id,
                category: incident.properties.category,
                magnitudeOfDelay: incident.properties.magnitudeOfDelay,
                description: incident.properties.description,
                delayInSeconds: incident.properties.delayInSeconds,
                roadCategory: incident.properties.roadCategory,
                averageSpeedKmph: incident.properties.averageSpeedKmph,
            })),
        };
    } catch (error) {
        return {
            error: `Failed to get shown incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
