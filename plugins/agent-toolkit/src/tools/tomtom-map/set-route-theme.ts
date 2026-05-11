/**
 * @module agent-toolkit-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the setRouteTheme tool. */
export const setRouteThemeOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        theme: z.object({
            mainColor: z.string().optional(),
        }),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for setting route theme.
 */
export const setRouteThemeSchema = z.object({
    mainColor: z
        .string()
        .optional()
        .describe(
            'CSS color for the route line and waypoint icons. Prefer CSS named colors when they match (e.g. "peachpuff", "coral", "steelblue"), otherwise use hex (e.g. "#FF0000").',
        ),
});

export const setRouteThemeDescription =
    'Color the route line + waypoint icons consistently across all route layers (preferred over setPaintProperties for route styling). Requires a route on the map.';

const currentTheme: { mainColor?: string } = {};

/**
 * Execute set route theme.
 */
export const executeSetRouteTheme = async (params: z.infer<typeof setRouteThemeSchema>, state: ToolState) => {
    try {
        if (params.mainColor !== undefined) currentTheme.mainColor = params.mainColor;

        // RoutingModules are now per-entry. Apply the theme to whichever
        // entry is currently rendering — that's the one the user sees. If
        // nothing is on the map, surface a clear error so the LLM knows to
        // call updateRoutesDisplay first.
        const routingModule = state.routing.currentEntryModule;
        if (!routingModule) {
            return { error: 'No route currently shown — call updateRoutesDisplay or setRoute first.' };
        }
        routingModule.applyConfig({
            theme: {
                mainColor: currentTheme.mainColor,
            },
        });

        return {
            success: true as const,
            theme: { ...currentTheme },
        };
    } catch (error) {
        return {
            error: `Failed to set route theme: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
