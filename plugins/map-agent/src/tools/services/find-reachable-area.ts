/**
 * @module map-agent-tools
 */

import type { Place, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { GeometryTheme } from '@tomtom-org/maps-sdk/map';
import type { BudgetType, ReachableRangeParams } from '@tomtom-org/maps-sdk/services';
import { calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import { type Tool, tool } from 'ai';
import { Position } from 'geojson';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { makeRangeLabel } from '../../utils/state-labels';
import { locationInputSchema, resolveLocationInput } from '../shared/location-input';
import { toolErrorSchema } from '../shared-output-schemas';

export const budgetSchema = z.object({
    type: z
        .enum(['timeMinutes', 'distanceKM']) // TODO: 'remainingChargeCPT', 'spentChargePCT', 'spentFuelLiters' these need vehicle data
        .describe('Budget type including its unit.'),
    value: z.number().describe('Budget value. e.g. 30 for 30 minutes, 50 for 50 km.'),
});

export const findReachableAreaSchema = z.object({
    origin: locationInputSchema.describe('Starting point for the range calculation.'),
    budgets: z
        .array(budgetSchema)
        .min(1)
        .describe(
            'One or more budget constraints. Pass multiple for nested ranges (e.g. 10, 20, 30 min or km). Order does not matter — sorted internally.',
        ),
    theme: z
        .enum(['filled', 'inverted', 'outline'])
        .optional()
        .describe(
            'Visual theme for the polygons. Default: outline (transparent fill with thick colored border). Use inverted for a donut (reachable highlighted, outside dimmed) or filled for solid polygons.',
        ),
    showOnMap: z.boolean().describe('Whether to render the range polygon(s) on the map.'),
    showOriginPin: z.boolean().optional().describe('Whether to drop a pin at the origin. Default: true.'),
});

const rangeOutputSchema = z.object({
    rangeId: z.string(),
    originName: z.string(),
    budgets: z.array(budgetSchema),
});

export const findReachableAreaOutputSchema = z.union([
    rangeOutputSchema,
    z.object({ status: z.enum(['not_found', 'no_results']) }),
    toolErrorSchema,
]);

export const findReachableAreaDescription =
    'Find the reachable area (isochrone/isodistance polygon) from an origin within time or distance budgets. ' +
    'Pass multiple budgets for nested ranges (e.g. 10/20/30 min or 10/25/50 km). ' +
    'Results stored in state; use recallRanges to retrieve. ' +
    'showOnMap renders the polygons on the map. ' +
    'status: not_found if origin cannot be resolved; no_results if API returns empty geometry.';

async function computeReachableRanges(budgets: z.infer<typeof budgetSchema>[], origin: Position) {
    const paramsArray: ReachableRangeParams[] = budgets.map((b) => ({
        origin,
        budget: { type: b.type as BudgetType, value: b.value },
    }));
    const result = await calculateReachableRanges(paramsArray);
    return result.features.length === 0 ? null : result;
}

async function displayRangeResults(
    state: ToolState,
    result: PolygonFeatures,
    theme: GeometryTheme,
    position: Position,
    originName: string,
    showOnMap: boolean,
    showOriginPin: boolean,
) {
    if (showOnMap) {
        const geomModule = await state.ranges.getGeometriesModule(theme);
        await geomModule.show(result);
        if (result.bbox) {
            state.baseMap.mapLibreMap.fitBounds(result.bbox, {
                padding: 50,
            });
        }
    }
    if (showOriginPin) {
        const originPlace: Place = {
            type: 'Feature',
            id: 'range-origin',
            geometry: { type: 'Point', coordinates: position },
            properties: {
                type: 'Point Address',
                address: { freeformAddress: originName },
            },
        };
        const placesModule = await state.ranges.getPlacesModule();
        await placesModule.show(originPlace);
    }
}

export function createFindReachableAreaTool(state: ToolState): Tool {
    return tool({
        description: findReachableAreaDescription,
        inputSchema: findReachableAreaSchema,
        outputSchema: findReachableAreaOutputSchema,
        execute: async (params): Promise<z.infer<typeof findReachableAreaOutputSchema>> => {
            const { origin, budgets, theme, showOnMap, showOriginPin = true } = params;

            try {
                const resolved = await resolveLocationInput(origin);
                if (!resolved) return { status: 'not_found' };
                const { position, name: originName, query: originQuery } = resolved;

                const sortedBudgets = [...budgets].sort((a, b) => b.value - a.value);

                const result = await computeReachableRanges(sortedBudgets, position);
                if (!result) return { status: 'no_results' };

                const resolvedTheme = theme ?? 'outline';

                const originEntry = originQuery ? { query: originQuery, position } : { position };
                const rangeId = state.ranges.addEntry({
                    label: makeRangeLabel(sortedBudgets, originName),
                    origin: originEntry,
                    budgets: sortedBudgets,
                    polygon: result,
                });

                await displayRangeResults(state, result, resolvedTheme, position, originName, showOnMap, showOriginPin);

                return { rangeId, originName, budgets: sortedBudgets };
            } catch (error) {
                return {
                    error: `Reachable area calculation failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
