/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-tile-incidents tool. */
export const getShownTileIncidentsOutputSchema = z.union([
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

/** Tool schema for get-shown-tile-incidents. */
export const getShownTileIncidentsSchema = z.object({});

export const getShownTileIncidentsDescription =
    'List the traffic incidents currently rendered by the TomTom traffic-tile overlay (the rasterised live tiles, ' +
    'not the GeoJSON `getTrafficIncidents` service). Reads `state.trafficTiles.getTrafficIncidentsModule().getShown()` — ' +
    'so it only reflects what the tile layer is showing in the current viewport. ' +
    'For full TrafficIncident objects (with start/end times, road numbers, lanes, …) call `getTrafficIncidents` instead; ' +
    'for "incidents along this route" read `route.properties.sections.traffic[]` via `analyseData`.';

/** Execute get-shown-tile-incidents. */
export const executeGetShownTileIncidents = async (
    _params: z.infer<typeof getShownTileIncidentsSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownTileIncidentsOutputSchema>> => {
    try {
        const trafficIncidentsModule = await state.trafficTiles.getTrafficIncidentsModule();
        const shown = trafficIncidentsModule.getShown();

        if (shown.trafficIncidents.length === 0) {
            return { error: 'No traffic incidents currently rendered by the traffic-tile overlay.' };
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
            error: `Failed to read traffic-tile overlay incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
