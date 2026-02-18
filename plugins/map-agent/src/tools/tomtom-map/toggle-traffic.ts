/**
 * @module map-agent-tools
 */

import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for toggling traffic flow.
 */
export const toggleTrafficFlowSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide traffic flow'),
});

/**
 * Tool schema for toggling traffic incidents.
 */
export const toggleTrafficIncidentsSchema = z.object({
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
            const { visible } = params as z.infer<typeof toggleTrafficFlowSchema>;
            try {
                // Lazy-init TrafficFlowModule
                const trafficFlowModule = await context.map.getTrafficFlowModule();

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
                const trafficIncidentsModule = await context.map.getTrafficIncidentsModule();

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
        },
    });
}
