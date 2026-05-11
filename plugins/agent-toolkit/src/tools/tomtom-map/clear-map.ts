/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the clear-map tool. */
export const clearMapOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        cleared: z.array(z.string()),
    }),
    toolErrorSchema,
]);

const CLEAR_LAYERS = ['places', 'routes', 'geometries', 'analytics', 'incidents'] as const;
type ClearLayer = (typeof CLEAR_LAYERS)[number];

/**
 * Tool schema for clearing map features.
 */
export const clearMapSchema = z.object({
    layers: z
        .array(z.enum(CLEAR_LAYERS))
        .optional()
        .describe(
            'Layers to clear (default: all). `analytics` covers traffic area analytics; `incidents` covers fetched traffic incidents.',
        ),
});

export const clearMapDescription =
    'Remove displayed features from the map (places, routes, geometries, analytics, incidents). Use to clean up before showing new results or to reset the map.';

const clearPlaces = (state: ToolState): Promise<void> => state.places.clearShownEntries();

// Each routing entry owns its own RoutingModule; walk them all so we don't leave stale
// routes from a previously-shown entry.
const clearRoutes = async (state: ToolState): Promise<void> => {
    for (const entry of state.routing.entries) {
        if (entry._module) {
            await entry._module.clearRoutes();
            await entry._module.clearWaypoints();
        }
    }
};

// Polygon overlays come from three slices: cached place-footprint polygons on places entries,
// isochrone polygons + origin pins on ranges entries (hideEntry clears both modules and resets
// `_shown`), and derived custom-geometries entries. Sequential awaits — Promise.all here can
// race the SDK/MapLibre.
const clearGeometries = async (state: ToolState): Promise<void> => {
    await state.places.clearShownGeometries();
    for (const entryId of state.ranges.shownEntryIds) {
        await state.ranges.hideEntry(entryId);
    }
    for (const entryId of state.customGeometries.shownEntryIds) {
        await state.customGeometries.hideEntry(entryId);
    }
};

const clearAnalytics = async (state: ToolState): Promise<void> => {
    const module = state.trafficAreaAnalytics.trafficAreaAnalyticsModule;
    if (module) await module.clear();
};

// Per-entry modules now — hide every entry that's currently rendered. Each entry's module
// clears itself on hide. Entries stay in history; this is a map-only clear. Sequential
// awaits — concurrent hide/clear calls race the SDK/MapLibre state machine.
const clearIncidents = async (state: ToolState): Promise<void> => {
    for (const id of state.trafficIncidents.shownEntryIds) {
        await state.trafficIncidents.hideEntry(id);
    }
};

/**
 * Execute clear map.
 */
export const executeClearMap = async (params: z.infer<typeof clearMapSchema>, state: ToolState) => {
    const { layers } = params;
    try {
        const shouldClear = (layer: ClearLayer): boolean => !layers || layers.length === 0 || layers.includes(layer);

        if (shouldClear('places')) await clearPlaces(state);
        if (shouldClear('routes')) await clearRoutes(state);
        if (shouldClear('geometries')) await clearGeometries(state);
        if (shouldClear('analytics')) await clearAnalytics(state);
        if (shouldClear('incidents')) await clearIncidents(state);

        return {
            success: true,
            cleared: layers || [...CLEAR_LAYERS],
        };
    } catch (error) {
        return {
            error: `Failed to clear map: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
