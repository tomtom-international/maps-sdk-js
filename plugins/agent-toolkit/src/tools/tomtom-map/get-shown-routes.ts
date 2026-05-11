/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { summarizeRoutes } from '../../utils';
import { routesOutputSchema, toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-shown-routes tool. */
export const getShownRoutesOutputSchema = z.union([routesOutputSchema, toolErrorSchema]);

/**
 * Tool schema for getting shown routes on map.
 */
export const getShownRoutesSchema = z.object({});

export const getShownRoutesDescription =
    'Return routes currently rendered on the map (reads map state, not history). Use after updateRoutesDisplay.';

/**
 * Execute get shown routes.
 */
export const executeGetShownRoutes = async (
    _params: z.infer<typeof getShownRoutesSchema>,
    state: ToolState,
): Promise<z.infer<typeof getShownRoutesOutputSchema>> => {
    try {
        if (!state.routing.currentEntryModule) {
            return { count: 0, routes: [] };
        }

        const shown = state.routing.currentEntryModule.getShown();

        if (!shown.mainLines || shown.mainLines.features.length === 0) {
            return { count: 0, routes: [] };
        }

        return summarizeRoutes(shown.mainLines);
    } catch (error) {
        return {
            error: `Failed to get shown routes: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
