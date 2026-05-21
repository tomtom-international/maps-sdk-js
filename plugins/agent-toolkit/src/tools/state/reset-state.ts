/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const DEFAULT_STYLE_ID = 'standardLight';

// Slices wiped by `executeResetState`. Kept as a single source of truth so the
// output schema's enum and the returned `cleared` array can't drift apart.
const CLEARED_SLICES = [
    'places',
    'routes',
    'ranges',
    'customGeometries',
    'trafficAreaAnalytics',
    'trafficIncidents',
    'byod',
    'mapPOIs',
    'trafficFlow',
    'mapStyle',
] as const;

/** Output schema for reset-state. */
export const resetStateOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        cleared: z.array(z.enum(CLEARED_SLICES)).describe('Slices that were wiped / reset to defaults.'),
    }),
    toolErrorSchema,
]);

/** Tool schema for reset-state. */
export const resetStateSchema = z.object({});

export const resetStateDescription =
    'Wipe the session: drops every places/routes/ranges entry + their map renders, resets POIs + traffic ' +
    'configs to defaults, reverts the map style to "standardLight". Destructive — use only when the user ' +
    'explicitly asks for a clean slate ("start over", "reset", "clear everything").';

export const executeResetState = async (
    _params: z.infer<typeof resetStateSchema>,
    state: ToolState,
): Promise<z.infer<typeof resetStateOutputSchema>> => {
    try {
        // 1. Visually clear every initialised module BEFORE the in-memory
        //    state resets. With per-entry modules, we walk every entry on
        //    every slice and clear whatever it has wired up. Without this
        //    pass the MapLibre sources keep the last-rendered features even
        //    after the entry history is gone.
        await state.places.clearShownEntries();
        for (const entry of state.places.entries) {
            await entry._modules?.geometries?.clear();
        }

        for (const entry of state.routing.entries) {
            if (entry._module) {
                await entry._module.clearRoutes();
                await entry._module.clearWaypoints();
            }
        }

        for (const entry of state.ranges.entries) {
            await entry._modules?.geometries?.clear();
            await entry._modules?.places?.clear();
        }

        for (const entry of state.trafficAreaAnalytics.entries) {
            await entry._module?.clear();
        }

        // 2. POIs / traffic-flow / traffic-incidents — revert visualization
        //    configs to defaults via the SDK base's `resetConfig()`. Only
        //    touch modules that were actually initialised in this session;
        //    hitting the lazy getter would create the module just to reset it.
        state.mapPOIs.poisModule?.resetConfig();
        state.trafficTiles.trafficFlowModule?.resetConfig();
        state.trafficTiles.trafficIncidentsModule?.resetConfig();

        // 3. Drop history + module references and re-emit change events so
        //    the UI lights up empty. Every entry-owning slice with a `reset()`
        //    needs to be wiped — missing one leaves stale entries that show up
        //    in subsequent `recallState` / `recall*` calls even after a reset.
        state.places.reset();
        state.routing.reset();
        state.ranges.reset();
        state.customGeometries.reset();
        state.trafficAreaAnalytics.reset();
        state.trafficIncidents.reset();
        state.byod.reset();

        // 4. Map style: revert to the canonical default. `keepState: false`
        //    so any sources/layers added after the last `setStyle` call are
        //    dropped along with the previous style.
        state.baseMap.ttMap.setStyle(DEFAULT_STYLE_ID, { keepState: false });

        return {
            success: true,
            cleared: [...CLEARED_SLICES],
        };
    } catch (error) {
        return {
            error: `Failed to reset state: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
