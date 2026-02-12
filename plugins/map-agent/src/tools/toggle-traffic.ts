/**
 * @module map-agent-tools
 */

import { TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
import { dynamicTool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../types';

/**
 * Tool schema for toggling traffic.
 */
const toggleTrafficSchema = z.object({
    visible: z.boolean().describe('Whether to show or hide traffic flow'),
});

/**
 * Create the toggle traffic tool.
 */
export function createToggleTrafficTool(context: ToolContext): ReturnType<typeof dynamicTool> {
    return dynamicTool({
        description: 'Show or hide the real-time traffic flow layer',
        inputSchema: toggleTrafficSchema,
        execute: async (params) => {
            const { visible } = params as z.infer<typeof toggleTrafficSchema>;
            try {
                // Lazy-init TrafficFlowModule
                if (!context.state.modules.trafficFlow) {
                    context.state.modules.trafficFlow = await TrafficFlowModule.get(context.map);
                }

                context.state.modules.trafficFlow.setVisible(visible);

                return {
                    success: true,
                    trafficVisible: visible,
                };
            } catch (error) {
                return {
                    error: `Failed to toggle traffic: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
