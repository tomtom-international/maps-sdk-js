/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/**
 * Tool schema for toggling traffic flow.
 */
export const toggleTrafficFlowSchema = z.object({
    visible: z.boolean(),
});

/** Output schema for the toggle-traffic-flow tool. */
export const toggleTrafficFlowOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        trafficFlowVisible: z.boolean(),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for toggling traffic incidents.
 */
export const toggleTrafficIncidentsSchema = z.object({
    visible: z.boolean(),
});

/** Output schema for the toggle-traffic-incidents tool. */
export const toggleTrafficIncidentsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        trafficIncidentsVisible: z.boolean(),
    }),
    toolErrorSchema,
]);

export const toggleTrafficFlowDescription =
    'Toggle the REAL-TIME traffic flow layer — colored road segments showing live speed conditions. ' +
    'This is NOT historical analytics; use showTrafficAreaAnalytics for historical data.';

export const toggleTrafficIncidentsDescription =
    'Toggle REAL-TIME traffic incident markers on the map (jams, accidents, closures, roadworks). ' +
    'This is NOT historical analytics. Use getTrafficIncidents for incident details.';

/**
 * Execute toggle traffic flow.
 */
export const executeToggleTrafficFlow = async (params: z.infer<typeof toggleTrafficFlowSchema>, state: ToolState) => {
    const { visible } = params;
    try {
        // Lazy-init TrafficFlowModule
        const trafficFlowModule = await state.traffic.getTrafficFlowModule();

        trafficFlowModule.setVisible(visible);

        return {
            success: true,
            trafficFlowVisible: visible,
        };
    } catch (error) {
        return {
            error: `Failed to toggle traffic flow: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};

/**
 * Execute toggle traffic incidents.
 */
export const executeToggleTrafficIncidents = async (
    params: z.infer<typeof toggleTrafficIncidentsSchema>,
    state: ToolState,
) => {
    const { visible } = params;
    try {
        // Lazy-init TrafficIncidentsModule
        const trafficIncidentsModule = await state.traffic.getTrafficIncidentsModule();

        trafficIncidentsModule.setVisible(visible);

        return {
            success: true,
            trafficIncidentsVisible: visible,
        };
    } catch (error) {
        return {
            error: `Failed to toggle traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
