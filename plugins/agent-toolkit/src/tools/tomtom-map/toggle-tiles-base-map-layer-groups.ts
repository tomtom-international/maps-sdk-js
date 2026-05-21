/**
 * @module agent-toolkit-tools
 */

import { baseMapLayerGroupNames } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the toggle-tiles-base-map-layer-groups tool. */
export const toggleTilesBaseMapLayerGroupsOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        visible: z.boolean(),
        layerGroups: z.array(z.string()),
    }),
    toolErrorSchema,
]);

/** Tool schema for toggle-tiles-base-map-layer-groups. */
export const toggleTilesBaseMapLayerGroupsSchema = z.object({
    visible: z.boolean(),
    layerGroups: z.array(z.enum(baseMapLayerGroupNames)).describe('Vector-tile base-map layer groups to show or hide.'),
});

export const toggleTilesBaseMapLayerGroupsDescription =
    'Show / hide groups of vector-tile base-map style layers (water, buildings3D, roadLines, placeLabels, capitalLabels, …). ' +
    'Operates on the underlying MapLibre style — orthogonal to anything rendered through PlacesModule / RoutingModule / ' +
    'CustomGeoJSONModule (those layers are unaffected).';

/** Execute toggle-tiles-base-map-layer-groups. */
export const executeToggleTilesBaseMapLayerGroups = async (
    params: z.infer<typeof toggleTilesBaseMapLayerGroupsSchema>,
    state: ToolState,
) => {
    const { visible, layerGroups } = params;
    try {
        const baseMapModule = await state.baseMap.getBaseMapModule();
        baseMapModule.setVisible(visible, {
            layerGroups: {
                mode: 'include',
                names: layerGroups,
            },
        });
        return { success: true, visible, layerGroups };
    } catch (error) {
        return {
            error: `Failed to toggle tile base-map layer groups: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
