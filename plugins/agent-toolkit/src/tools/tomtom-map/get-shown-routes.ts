/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizeRoutes } from '../../utils/summarize';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-routes tool. */
export const getShownRoutesOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/**
 * Tool schema for getting shown routes on map.
 */
export const getShownRoutesSchema = z.object({});

export const getShownRoutesDescription =
    'Get routes currently shown on the map. ' +
    'Reads rendered map state (not plugin service history). Returns routes currently visible on map — use after showRoute.';

/**
 * Execute get shown routes.
 */
export async function executeGetShownRoutes(
    _params: z.infer<typeof getShownRoutesSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownRoutesOutputSchema>> {
    try {
        if (!state.routing.routingModule) {
            return { count: 0, routes: [] };
        }

        const shown = state.routing.routingModule.getShown();

        if (!shown.mainLines || shown.mainLines.features.length === 0) {
            return { count: 0, routes: [] };
        }

        return summarizeRoutes(shown.mainLines);
    } catch (error) {
        return {
            error: `Failed to get shown routes: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
