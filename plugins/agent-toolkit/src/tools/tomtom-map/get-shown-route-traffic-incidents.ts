/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-route-traffic-incidents tool. */
export const getShownRouteTrafficIncidentsOutputSchema = z.union([
    z.object({
        count: z.number(),
        trafficIncidents: z.array(
            z.object({
                id: z.string(),
                magnitudeOfDelay: z.string().describe('unknown|minor|moderate|major|indefinite'),
                title: z.string().optional(),
                delayInSeconds: z.number().optional(),
                effectiveSpeedInKmh: z.number().optional(),
                categories: z.array(z.string()).optional(),
            }),
        ),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting shown route traffic incidents on map.
 */
export const getShownRouteTrafficIncidentsSchema = z.object({});

export const getShownRouteTrafficIncidentsDescription =
    'Get the route traffic incidents currently displayed on the map (not from service, but what is actually shown). Each section has an id.';

/**
 * Execute get shown route traffic incidents.
 */
export async function executeGetShownRouteTrafficIncidents(
    _params: z.infer<typeof getShownRouteTrafficIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownRouteTrafficIncidentsOutputSchema>> {
    try {
        if (!state.routing.routingModule) {
            return { error: 'No routing module initialized - no route traffic incidents shown on map' };
        }

        const shown = state.routing.routingModule.getShown();

        if (!shown.incidents || shown.incidents.features.length === 0) {
            return { error: 'No route traffic incidents currently shown on the map' };
        }

        return {
            count: shown.incidents.features.length,
            trafficIncidents: shown.incidents.features.map((incident) => ({
                id: incident.properties.id,
                magnitudeOfDelay: incident.properties.magnitudeOfDelay,
                title: incident.properties.title,
                delayInSeconds: incident.properties.delayInSeconds,
                effectiveSpeedInKmh: incident.properties.effectiveSpeedInKmh,
                categories: incident.properties.categories,
            })),
        };
    } catch (error) {
        return {
            error: `Failed to get shown route traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
