/**
 * @module agent-toolkit-tools
 */

import type { Place, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import type { GeometryTheme } from '@tomtom-org/maps-sdk/map';
import type { BudgetType, ReachableRangeParams } from '@tomtom-org/maps-sdk/services';
import { calculateReachableRanges } from '@tomtom-org/maps-sdk/services';
import type { Position } from 'geojson';
import { z } from 'zod';
import type { ReachableRange, ToolState } from '../../types';
import { makeRangesLabel } from '../../utils';
import { hidePreviousEntriesSchema, hidePreviousShownEntries, locationInputSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';
import { resolveLocationInput } from './resolve-location-input';

export const budgetSchema = z.object({
    type: z
        .enum(['timeMinutes', 'distanceKM']) // TODO: 'remainingChargeCPT', 'spentChargePCT', 'spentFuelLiters' these need vehicle data
        .describe('Budget type including its unit.'),
    value: z.number().describe('Budget value. e.g. 30 for 30 minutes, 50 for 50 km.'),
});

export const findReachableAreasSchema = z.object({
    origins: z
        .array(locationInputSchema)
        .min(1)
        .describe(
            'One or more starting points; one reachable area is computed per origin under the same budgets and bundled into a single ranges entry. Pass a single-element array for the classic one-origin call.',
        ),
    budgets: z
        .array(budgetSchema)
        .min(1)
        .describe(
            'One or more budget constraints applied to every origin. Pass multiple for nested ranges (e.g. 10, 20, 30 min or km). Order does not matter — sorted internally.',
        ),
    theme: z
        .enum(['filled', 'inverted', 'outline'])
        .optional()
        .describe(
            'Visual theme for the polygons. Default: outline (transparent fill with thick colored border). Use inverted for a donut (reachable highlighted, outside dimmed) or filled for solid polygons.',
        ),
    showOnMap: z.boolean().describe('Whether to render the range polygon(s) on the map.'),
    showOriginPin: z.boolean().optional().describe('Whether to drop a pin at each origin. Default: true.'),
    hidePreviousEntries: hidePreviousEntriesSchema('ranges'),
});

const rangeOutputSchema = z.object({
    rangesId: z.string(),
    ranges: z.array(
        z.object({
            originName: z.string(),
            budgets: z.array(budgetSchema),
        }),
    ),
    skipped: z
        .array(z.object({ origin: z.string(), reason: z.string() }))
        .optional()
        .describe('Origins that could not contribute (unresolved query, empty geometry).'),
});

export const findReachableAreasOutputSchema = z.union([
    rangeOutputSchema,
    z.object({ status: z.enum(['no_results']) }),
    toolErrorSchema,
]);

export const findReachableAreasDescription =
    'Compute reachable-area polygons (isochrone/isodistance) from one or more origins under shared time/distance ' +
    'budgets. Multiple origins → compared in one call (sequential to respect QPS); multiple budgets → nested ' +
    'ranges. Stored in state (recallRanges); `showOnMap: true` renders. Per-origin failures land under ' +
    '`skipped` instead of aborting the whole call.';

const computeReachableRangesForOrigin = async (
    budgets: z.infer<typeof budgetSchema>[],
    origin: Position,
): Promise<PolygonFeatures | null> => {
    const paramsArray: ReachableRangeParams[] = budgets.map((b) => ({
        origin,
        budget: { type: b.type as BudgetType, value: b.value },
    }));
    const result = await calculateReachableRanges(paramsArray);
    return result.features.length === 0 ? null : result;
};

// Combine every range polygon into a single FeatureCollection so the geometries
// module can render them in one show() call and a single fitBounds covers them
// all. Per-origin features keep their original `properties` from the service.
const mergeRangePolygons = (ranges: ReachableRange[]): PolygonFeatures | null => {
    const features = ranges.flatMap((r) => r.polygon?.features ?? []);
    if (features.length === 0) return null;
    return {
        type: 'FeatureCollection',
        features,
    } as PolygonFeatures;
};

const formatOriginName = (range: ReachableRange): string =>
    range.origin.query ?? `${range.origin.position[1]}, ${range.origin.position[0]}`;

const showOriginsAndPolygons = async (
    state: ToolState,
    rangesId: string,
    ranges: ReachableRange[],
    theme: GeometryTheme,
    showOnMap: boolean,
    showOriginPin: boolean,
) => {
    if (showOnMap) {
        const merged = mergeRangePolygons(ranges);
        if (merged) {
            // Per-entry GeometriesModule — each ranges entry owns its own
            // module so multiple entries can be on the map simultaneously.
            const geomModule = await state.ranges.getEntryGeometriesModule(rangesId, theme);
            await geomModule.show(merged);
            if (merged.bbox) {
                state.baseMap.mapLibreMap.fitBounds(merged.bbox, { padding: 50 });
            }
        }
    }
    if (showOriginPin) {
        const placesModule = await state.ranges.getEntryPlacesModule(rangesId);
        const originPlaces: Place[] = ranges.map((r, i) => ({
            type: 'Feature',
            id: `range-origin-${rangesId}-${i}`,
            geometry: { type: 'Point', coordinates: r.origin.position },
            properties: {
                type: 'Point Address',
                address: { freeformAddress: formatOriginName(r) },
            },
        }));
        await placesModule.show(originPlaces);
    }
};

/** Standalone execute for ToolEntry format. */
export const executeFindReachableAreas = async (
    params: z.infer<typeof findReachableAreasSchema>,
    state: ToolState,
): Promise<z.infer<typeof findReachableAreasOutputSchema>> => {
    const { origins, budgets, theme, showOnMap, showOriginPin = true, hidePreviousEntries } = params;

    try {
        const sortedBudgets = [...budgets].sort((a, b) => b.value - a.value);

        // Sequential — fan-out would race the service's per-key QPS limit when
        // callers pass many origins. The cost is latency, not correctness.
        const ranges: ReachableRange[] = [];
        const skipped: { origin: string; reason: string }[] = [];
        for (const origin of origins) {
            const fallbackLabel =
                'query' in origin
                    ? origin.query
                    : 'position' in origin
                      ? `${origin.position.lat}, ${origin.position.lng}`
                      : 'placeId' in origin
                        ? origin.placeId
                        : 'unnamed origin';
            const resolved = await resolveLocationInput(origin, state);
            if (!resolved) {
                skipped.push({ origin: fallbackLabel, reason: 'origin not found' });
                continue;
            }
            const polygon = await computeReachableRangesForOrigin(sortedBudgets, resolved.position);
            if (!polygon) {
                skipped.push({ origin: resolved.name ?? fallbackLabel, reason: 'no reachable area returned' });
                continue;
            }
            ranges.push({
                origin: resolved.query
                    ? { query: resolved.query, position: resolved.position }
                    : { position: resolved.position },
                budgets: sortedBudgets,
                polygon,
            });
        }

        if (ranges.length === 0) return { status: 'no_results' };

        const resolvedTheme = theme ?? 'outline';
        const originNames = ranges.map(formatOriginName);
        const rangesId = await state.ranges.addEntry({
            label: makeRangesLabel(sortedBudgets, originNames),
            ranges,
        });

        if (showOnMap || showOriginPin) {
            await hidePreviousShownEntries(state.ranges, [rangesId], hidePreviousEntries);
        }

        await showOriginsAndPolygons(state, rangesId, ranges, resolvedTheme, showOnMap, showOriginPin);

        // Track which entry is rendered so state-digest snapshots can surface it later.
        if (showOnMap || showOriginPin) await state.ranges.markEntryShown(rangesId);

        // All ranges in this entry share the same `sortedBudgets`; reusing
        // it keeps the response type aligned with the input schema's narrower
        // budget enum (`ReachableRangeBudget` widens it with EV/fuel types).
        return {
            rangesId,
            ranges: ranges.map((r) => ({
                originName: formatOriginName(r),
                budgets: sortedBudgets,
            })),
            ...(skipped.length && { skipped }),
        };
    } catch (error) {
        return {
            error: `Reachable area calculation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
