/**
 * @module map-agent-tools
 */

import { TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for toggling traffic flow.
 */
const toggleTrafficFlowSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide traffic flow'),
});

/**
 * Tool schema for toggling traffic incidents.
 */
const toggleTrafficIncidentsSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide traffic incidents'),
});

/**
 * Create the toggle traffic flow tool.
 */
export function createToggleTrafficFlowTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Show or hide the real-time traffic flow layer',
        inputSchema: toggleTrafficFlowSchema,
        execute: async (params) => {
            const { visible } = params as z.infer<typeof toggleTrafficIncidentsSchema>;
            try {
                // Lazy-init TrafficFlowModule
                context.state.modules.trafficFlow ??= await TrafficFlowModule.get(context.map);

                context.state.modules.trafficFlow.setVisible(visible);

                return {
                    success: true,
                    trafficFlowVisible: visible,
                };
            } catch (error) {
                return {
                    error: `Failed to toggle traffic flow: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}

/**
 * Create the toggle traffic incidents tool.
 */
export function createToggleTrafficIncidentsTool(context: ToolContext): Tool {
    return dynamicTool({
        description: 'Show or hide the real-time traffic incidents layer',
        inputSchema: toggleTrafficIncidentsSchema,
        execute: async (params) => {
            const { visible } = params as z.infer<typeof toggleTrafficIncidentsSchema>;
            try {
                // Lazy-init TrafficIncidentsModule
                context.state.modules.trafficIncidents ??= await TrafficIncidentsModule.get(context.map);

                context.state.modules.trafficIncidents.setVisible(visible);

                return {
                    success: true,
                    trafficIncidentsVisible: visible,
                };
            } catch (error) {
                return {
                    error: `Failed to toggle traffic incidents: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
