/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Tool schema for toggle-tiles-traffic-flow. */
export const toggleTilesTrafficFlowSchema = z.object({
    visible: z.boolean(),
});

/** Output schema for the toggle-tiles-traffic-flow tool. */
export const toggleTilesTrafficFlowOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        trafficFlowVisible: z.boolean(),
    }),
    toolErrorSchema,
]);

/** Tool schema for toggle-tiles-traffic-incidents. */
export const toggleTilesTrafficIncidentsSchema = z.object({
    visible: z.boolean(),
});

/** Output schema for the toggle-tiles-traffic-incidents tool. */
export const toggleTilesTrafficIncidentsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        trafficIncidentsVisible: z.boolean(),
    }),
    toolErrorSchema,
]);

export const toggleTilesTrafficFlowDescription =
    'Toggle the vector-tile traffic-flow overlay (live coloured road segments). ' +
    'NOT the same as `updateTrafficAreaAnalyticsDisplay` (historical analytics) or `route.properties.sections.traffic[]` ' +
    '(per-route incidents). Just a base-map style layer on/off.';

export const toggleTilesTrafficIncidentsDescription =
    'Toggle the vector-tile traffic-incidents overlay (live jam/accident/closure markers). ' +
    'NOT the same as `getTrafficIncidents` (GeoJSON service → structured entries) or `analyseData` ' +
    '(sandbox over fetched entries). Just a base-map style layer on/off.';

/** Execute toggle-tiles-traffic-flow. */
export const executeToggleTilesTrafficFlow = async (
    params: z.infer<typeof toggleTilesTrafficFlowSchema>,
    state: ToolState,
) => {
    const { visible } = params;
    try {
        const trafficFlowModule = await state.trafficTiles.getTrafficFlowModule();
        trafficFlowModule.setVisible(visible);
        return { success: true, trafficFlowVisible: visible };
    } catch (error) {
        return {
            error: `Failed to toggle tile traffic flow: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};

/** Execute toggle-tiles-traffic-incidents. */
export const executeToggleTilesTrafficIncidents = async (
    params: z.infer<typeof toggleTilesTrafficIncidentsSchema>,
    state: ToolState,
) => {
    const { visible } = params;
    try {
        const trafficIncidentsModule = await state.trafficTiles.getTrafficIncidentsModule();
        trafficIncidentsModule.setVisible(visible);
        return { success: true, trafficIncidentsVisible: visible };
    } catch (error) {
        return {
            error: `Failed to toggle tile traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
