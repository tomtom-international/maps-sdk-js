/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for getting shown route traffic incidents on map.
 */
export const getShownRouteTrafficIncidentsSchema = z.object({});

/**
 * Create the get shown route traffic incidents tool.
 */
export function createGetShownRouteTrafficIncidentsTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Get the route traffic incidents currently displayed on the map (not from service, but what is actually shown)',
        inputSchema: getShownRouteTrafficIncidentsSchema,
        execute: async () => {
            try {
                if (!context.map.modules.routing) {
                    return { error: 'No routing module initialized - no route traffic incidents shown on map' };
                }

                const shown = context.map.modules.routing.getShown();

                if (!shown.incidents || shown.incidents.features.length === 0) {
                    return { error: 'No route traffic incidents currently shown on the map' };
                }

                return {
                    count: shown.incidents.features.length,
                    trafficIncidents: shown.incidents.features.map((incident) => ({
                        magnitudeOfDelay: incident.properties.magnitudeOfDelay,
                        title: incident.properties.title,
                        delayInSeconds: incident.properties.delayInSeconds,
                        effectiveSpeedInKmh: incident.properties.effectiveSpeedInKmh,
                        categories: incident.properties.categories,
                        position: incident.geometry.coordinates,
                    })),
                };
            } catch (error) {
                return {
                    error: `Failed to get shown route traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
