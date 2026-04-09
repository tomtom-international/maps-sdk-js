/**
 * @module map-agent-tools
 */

import { baseMapLayerGroupNames } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the toggle-base-map-layer-groups tool. */
export const toggleBaseMapLayerGroupsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        visible: z.boolean(),
        layerGroups: z.array(z.string()),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for toggling base map layer groups.
 */
export const toggleBaseMapLayerGroupsSchema = z.object({
    visible: z.boolean(),
    layerGroups: z.array(z.enum(baseMapLayerGroupNames)).describe('The base map layer groups to show or hide.'),
});

export const toggleBaseMapLayerGroupsDescription =
    'Show or hide specific base map layer groups (water, buildings3D, roadLines, placeLabels, capitalLabels, etc.)';

/**
 * Execute toggle base map layer groups.
 */
export async function executeToggleBaseMapLayerGroups(
    params: z.infer<typeof toggleBaseMapLayerGroupsSchema>,
    state: ToolState,
) {
    const { visible, layerGroups } = params;
    try {
        // Lazy-init BaseMapModule
        const baseMapModule = await state.baseMap.getBaseMapModule();

        baseMapModule.setVisible(visible, {
            layerGroups: {
                mode: 'include',
                names: layerGroups,
            },
        });

        return {
            success: true,
            visible,
            layerGroups,
        };
    } catch (error) {
        return {
            error: `Failed to toggle layer groups: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
