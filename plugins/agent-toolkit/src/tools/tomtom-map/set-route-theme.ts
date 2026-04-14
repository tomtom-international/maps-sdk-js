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
    'Style the route line and waypoint icons with a color. ' +
    'Prefer this over setPaintProperties for route styling — it applies the color consistently across all route and waypoint layers. ' +
    'Requires a route to be shown on the map.';

const currentTheme: { mainColor?: string } = {};

/**
 * Execute set route theme.
 */
export async function executeSetRouteTheme(params: z.infer<typeof setRouteThemeSchema>, state: ToolState) {
    try {
        if (params.mainColor !== undefined) currentTheme.mainColor = params.mainColor;

        const routingModule = await state.routing.getRoutingModule();
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
}
