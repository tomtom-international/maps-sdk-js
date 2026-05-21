/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { TrafficAreaAnalyticsEntry } from '../../state';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const renderKnobs = {
    mode: z
        .enum(['hexgrid-3d', 'hexgrid-2d', 'square-3d', 'square-2d', 'heatmap'])
        .optional()
        .describe(
            "Visualization mode. 'hexgrid-3d' (default): 3D hexagons. 'hexgrid-2d': flat hexagons. 'square-3d': 3D squares. 'square-2d': flat squares. 'heatmap': density layer.",
        ),
    metric: z
        .enum(['congestionLevel', 'speed', 'travelTime'])
        .optional()
        .describe('Metric to visualize. Defaults to first fetched metric on the targeted entries.'),
    colorTheme: z
        .enum(['trafficLight', 'heat', 'monochrome', 'viridis', 'plasma'])
        .optional()
        .describe(
            "Preset color theme. 'trafficLight' (green→amber→red, default), 'heat' (blue→orange→red), 'monochrome' (grey), 'viridis' (purple→green→yellow), 'plasma' (purple→magenta→yellow).",
        ),
    heightScale: z
        .number()
        .optional()
        .describe('Extrusion height multiplier / visual maximum in meters. Default: metric-dependent.'),
    scaleMode: z
        .enum(['raw', 'predefinedRange', 'currentRange'])
        .optional()
        .describe(
            "Height scaling mode. 'raw' (default), 'predefinedRange' (normalize to SDK range), 'currentRange' (normalize to live data range).",
        ),
    filter: z
        .object({
            min: z.number().optional(),
            max: z.number().optional(),
        })
        .refine((filter) => filter.min !== undefined || filter.max !== undefined, {
            message: 'Filter must have at least one of min or max',
        })
        .optional()
        .describe('Filter visible tiles for the active metric by value range.'),
} as const;

const summarySchema = z.object({
    id: z.string(),
    label: z.string(),
    activeMetric: z.string().optional(),
    displayMode: z.string().optional(),
});

/** Tool schema for update-traffic-area-analytics-display. */
export const updateTrafficAreaAnalyticsDisplaySchema = z
    .object({
        add: z
            .array(z.string())
            .optional()
            .describe('Entry ids to render (e.g. ["tta-0"]). Use `recallState` to list available ids.'),
        remove: z.array(z.string()).optional().describe('Entry ids to hide.'),
        addMatching: z.array(z.string()).optional().describe('Label substrings to show.'),
        removeMatching: z.array(z.string()).optional().describe('Label substrings to hide.'),
        clear: z.boolean().optional().describe('Hide every displayed entry.'),
        fitBounds: z
            .boolean()
            .optional()
            .describe(
                'Pan/zoom to fit the union of currently-shown entry bboxes. Defaults to true when entries are added.',
            ),
        ...renderKnobs,
    })
    .refine(
        (data) =>
            data.add !== undefined ||
            data.remove !== undefined ||
            data.addMatching !== undefined ||
            data.removeMatching !== undefined ||
            data.clear === true ||
            data.mode !== undefined ||
            data.metric !== undefined ||
            data.colorTheme !== undefined ||
            data.heightScale !== undefined ||
            data.scaleMode !== undefined ||
            data.filter !== undefined,
        {
            message:
                'updateTrafficAreaAnalyticsDisplay requires at least one of: add, remove, addMatching, removeMatching, clear, mode, metric, colorTheme, heightScale, scaleMode, filter.',
        },
    );

/** Output schema for the update-traffic-area-analytics-display tool. */
export const updateTrafficAreaAnalyticsDisplayOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        totalShown: z.number(),
        shown: z.array(summarySchema).describe('Traffic-area-analytics entries currently on the map.'),
        actuallyAdded: z.array(z.string()),
        actuallyRemoved: z.array(z.string()),
    }),
    toolErrorSchema,
]);

export const updateTrafficAreaAnalyticsDisplayDescription =
    'Show, hide, swap, and restyle HISTORICAL traffic-area-analytics entries on the map in one atomic call. ' +
    'Target entries by id (`add` / `remove`) or by label substring (`addMatching` / `removeMatching`). ' +
    '`clear` hides every currently-shown entry; combine with `add` to swap. ' +
    'Render knobs (`mode`, `metric`, `colorTheme`, `heightScale`, `scaleMode`, `filter`) apply to every entry being added AND every entry that stays shown after this call. ' +
    'When only render knobs are set with no add/remove/clear, implicitly targets the most recently added entry. ' +
    'Not real-time — use `toggleTilesTrafficFlow` for the live vector-tile flow overlay.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resolveMatchingIds = (state: ToolState, terms: readonly string[]): string[] => {
    if (terms.length === 0) return [];
    const needles = terms.map((term) => term.toLowerCase());
    const matched = new Set<string>();
    for (const entry of state.trafficAreaAnalytics.entries) {
        if (needles.some((needle) => entry.label.toLowerCase().includes(needle))) {
            matched.add(entry.id);
        }
    }
    return [...matched];
};

type ResolvedSelectors = { add: string[]; remove: string[] } | { error: string };

const resolveSelectors = (
    state: ToolState,
    params: z.infer<typeof updateTrafficAreaAnalyticsDisplaySchema>,
): ResolvedSelectors => {
    const { add, remove, addMatching, removeMatching, clear } = params;
    let resolvedAdd = [...(add ?? []), ...resolveMatchingIds(state, addMatching ?? [])];
    const resolvedRemove = [...(remove ?? []), ...resolveMatchingIds(state, removeMatching ?? [])];

    // Implicit-latest: render knobs but no entry selectors → target the most recent entry.
    const onlyRenderKnobs =
        add === undefined &&
        addMatching === undefined &&
        remove === undefined &&
        removeMatching === undefined &&
        clear !== true;
    const hasRenderKnobs =
        params.mode !== undefined ||
        params.metric !== undefined ||
        params.colorTheme !== undefined ||
        params.heightScale !== undefined ||
        params.scaleMode !== undefined ||
        params.filter !== undefined;
    if (onlyRenderKnobs && hasRenderKnobs) {
        const latestId = state.trafficAreaAnalytics.entries.at(-1)?.id;
        if (!latestId) {
            return { error: 'No traffic-area-analytics entries available. Call getTrafficAreaAnalytics first.' };
        }
        resolvedAdd = [latestId];
    }

    const knownIds = new Set(state.trafficAreaAnalytics.entries.map((entry) => entry.id));
    const unknownAdd = resolvedAdd.filter((id) => !knownIds.has(id));
    if (unknownAdd.length > 0) {
        return {
            error: `Unknown traffic-area-analytics entry ids: ${unknownAdd.join(', ')}. Use recallState to list available ids.`,
        };
    }
    return { add: resolvedAdd, remove: resolvedRemove };
};

const applyRenderKnobs = async (
    state: ToolState,
    entryId: string,
    params: z.infer<typeof updateTrafficAreaAnalyticsDisplaySchema>,
): Promise<void> => {
    const entry = state.trafficAreaAnalytics.findById(entryId);
    if (!entry) return;
    const defaultMetric = entry.data.properties?.metrics?.[0] ?? 'congestionLevel';
    const mode = params.mode ?? 'hexgrid-3d';
    const metric = params.metric ?? defaultMetric;
    const colorTheme = params.colorTheme ?? 'trafficLight';

    const module = await state.trafficAreaAnalytics.getEntryModule(entryId);
    module.setMode(mode);
    module.setMetric(metric);
    module.setColor(colorTheme);
    if (params.heightScale !== undefined || params.scaleMode !== undefined) {
        module.setHeight({
            ...(params.heightScale !== undefined && { maxHeightMeters: params.heightScale }),
            ...(params.scaleMode !== undefined && { scaleMode: params.scaleMode }),
        });
    }
    if (params.filter) {
        module.filter({ min: params.filter.min, max: params.filter.max });
    } else {
        module.clearFilter();
    }
};

const summarizeEntry = (entry: TrafficAreaAnalyticsEntry): z.infer<typeof summarySchema> => ({
    id: entry.id,
    label: entry.label,
    ...(entry._config?.activeMetric && { activeMetric: entry._config.activeMetric }),
    ...(entry._config?.displayMode && { displayMode: entry._config.displayMode }),
});

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export const executeUpdateTrafficAreaAnalyticsDisplay = async (
    params: z.infer<typeof updateTrafficAreaAnalyticsDisplaySchema>,
    state: ToolState,
): Promise<z.infer<typeof updateTrafficAreaAnalyticsDisplayOutputSchema>> => {
    try {
        const selectors = resolveSelectors(state, params);
        if ('error' in selectors) return selectors;
        const { add: resolvedAdd, remove: resolvedRemove } = selectors;

        const beforeShown = new Set(state.trafficAreaAnalytics.shownEntryIds);

        if (params.clear) {
            for (const id of state.trafficAreaAnalytics.shownEntryIds) {
                await state.trafficAreaAnalytics.hideEntry(id);
            }
        }
        for (const id of resolvedRemove) {
            await state.trafficAreaAnalytics.hideEntry(id);
        }
        for (const id of resolvedAdd) {
            await state.trafficAreaAnalytics.showEntry(id);
        }

        const afterShown = state.trafficAreaAnalytics.shownEntryIds;
        const actuallyAdded = resolvedAdd.filter((id) => !beforeShown.has(id) && afterShown.has(id));
        const actuallyRemoved = resolvedRemove.filter((id) => beforeShown.has(id) && !afterShown.has(id));

        // Render knobs apply to: every entry just added AND every entry currently shown after the call
        // (so existing entries pick up new mode/metric/colorTheme/filter).
        const targets = new Set<string>([...actuallyAdded, ...afterShown]);
        for (const id of targets) await applyRenderKnobs(state, id, params);

        const shouldFit = params.fitBounds ?? actuallyAdded.length > 0;
        if (shouldFit && afterShown.size > 0) {
            const features = state.trafficAreaAnalytics.entries
                .filter((e) => afterShown.has(e.id))
                .flatMap((e) => e.data.features);
            const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features });
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50, pitch: 45 });
            }
        }

        const shown = state.trafficAreaAnalytics.entries.filter((e) => afterShown.has(e.id)).map(summarizeEntry);

        return {
            success: true as const,
            totalShown: afterShown.size,
            shown,
            actuallyAdded,
            actuallyRemoved,
        };
    } catch (error) {
        return {
            error: `Failed to update traffic-area-analytics display: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
