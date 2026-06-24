/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON, type Routes } from '@tomtom-org/maps-sdk/core';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const shownRouteEntrySummarySchema = z.object({
    id: z.string(),
    label: z.string(),
    routeCount: z.number().describe('Number of route alternatives in the entry.'),
    selectedIndex: z.number().describe('Highlighted alternative index (0 unless overridden by this call).'),
});

export const updateRoutesDisplayOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        totalShown: z.number(),
        shown: z
            .array(shownRouteEntrySummarySchema)
            .describe('Routes entries currently on the map, with their labels.'),
        actuallyAdded: z
            .array(z.string())
            .describe('Ids from `add` / `addMatching` that were not already shown. Empty if it was a no-op.'),
        actuallyRemoved: z
            .array(z.string())
            .describe('Ids from `remove` / `removeMatching` that were actually on the map. Empty if no-op.'),
        mainColor: z
            .string()
            .optional()
            .describe('Sticky main colour now applied to every shown route, when set by this or a previous call.'),
    }),
    toolErrorSchema,
]);

export const updateRoutesDisplaySchema = z
    .object({
        add: z
            .array(z.string())
            .optional()
            .describe(
                'Entry ids to show (e.g. ["routes-1"]). ' +
                    'Omit while still setting `selectedIndex` to target the most recently stored entry.',
            ),
        remove: z.array(z.string()).optional().describe('Entry ids to hide.'),
        addMatching: z.array(z.string()).optional().describe('Label substrings to show.'),
        removeMatching: z.array(z.string()).optional().describe('Label substrings to hide.'),
        clear: z.boolean().optional().describe('Hide every displayed entry.'),
        selectedIndex: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe(
                'Which alternative variant to highlight on newly-added entries (default: 0). ' +
                    'Use to switch the selected alternative on a multi-alternative result. ' +
                    'Applied after the entry is shown — entries previously rendered with another index are re-rendered.',
            ),
        fitBounds: z
            .boolean()
            .optional()
            .describe(
                'Pan/zoom to fit the resulting display. Defaults to true when entries are being added, false otherwise.',
            ),
        mainColor: z
            .string()
            .optional()
            .describe(
                'Recolor the route line + waypoint icons. CSS named colour ("coral", "steelblue") or hex ("#FF0000"). ' +
                    'Sticky — applied to every currently-shown entry AND remembered so subsequent shows pick it up automatically. ' +
                    'Can be set by itself (no add/remove/clear) to recolor without changing visibility.',
            ),
    })
    .refine(
        (data) =>
            data.add !== undefined ||
            data.remove !== undefined ||
            data.addMatching !== undefined ||
            data.removeMatching !== undefined ||
            data.clear === true ||
            data.selectedIndex !== undefined ||
            data.mainColor !== undefined,
        {
            message:
                'updateRoutesDisplay requires at least one of: add, remove, addMatching, removeMatching, clear, selectedIndex, mainColor.',
        },
    );

export const updateRoutesDisplayDescription =
    'Show, hide, swap, and recolor which routes entries are displayed on the map in one atomic call. ' +
    'Target entries by id (`add` / `remove`) or by label substring (`addMatching` / `removeMatching`). ' +
    '`clear` hides every currently-shown entry; combine with `add` to swap the display ("hide everything, show this"). ' +
    '`selectedIndex` re-highlights an alternative variant on the newly-added entries; with no ' +
    '`add`/`addMatching` it implicitly targets the most recently stored entry. ' +
    '`mainColor` recolors the route line + waypoint icons (sticky across entry swaps — applied to current shows AND remembered); ' +
    'it does NOT auto-show a hidden entry, so set `add`/`addMatching` too if nothing is on the map yet. ' +
    'Does not delete from history. Does not call any service.';

const resolveMatchingIds = (state: ToolState, terms: readonly string[]): string[] => {
    if (terms.length === 0) return [];
    const needles = terms.map((term) => term.toLowerCase());
    const matched = new Set<string>();
    for (const entry of state.routing.entries) {
        const label = entry.label.toLowerCase();
        if (needles.some((needle) => label.includes(needle))) {
            matched.add(entry.id);
        }
    }
    return [...matched];
};

type ResolvedSelectors = { add: string[]; remove: string[] } | { error: string };

// Resolves user-provided selectors into concrete entry-id sets. Handles label-matching, the
// implicit "latest entry" fallback when only `selectedIndex` is set, and the unknown-id check
// that gates the rest of the executor.
const resolveSelectors = (state: ToolState, params: z.infer<typeof updateRoutesDisplaySchema>): ResolvedSelectors => {
    const { add, remove, addMatching, removeMatching, selectedIndex } = params;
    let resolvedAdd = [...(add ?? []), ...resolveMatchingIds(state, addMatching ?? [])];
    const resolvedRemove = [...(remove ?? []), ...resolveMatchingIds(state, removeMatching ?? [])];

    // `selectedIndex` implicitly targets "the most recently stored entry" when no
    // `add` / `addMatching` is supplied. `mainColor` is handled separately by the executor
    // (sticky, applies to whatever is shown — no implicit-latest add needed).
    const implicitLatest = add === undefined && addMatching === undefined && selectedIndex !== undefined;
    if (implicitLatest) {
        const latestId = state.routing.entries.at(-1)?.id;
        if (!latestId) {
            return { error: 'No routes available to display. Calculate a route first via setRoute.' };
        }
        resolvedAdd = [latestId];
    }

    const knownIds = new Set(state.routing.entries.map((entry) => entry.id));
    const unknownAdd = resolvedAdd.filter((id) => !knownIds.has(id));
    if (unknownAdd.length > 0) {
        return {
            error: `Unknown routes entry ids: ${unknownAdd.join(', ')}. Use recallState to list available entries.`,
        };
    }
    return { add: resolvedAdd, remove: resolvedRemove };
};

// `state.routing.showEntry` always renders with selectedIndex 0. For a non-zero selection we
// re-render directly on the entry's module after the show, mirroring the previous show-routes
// behavior. Done sequentially per the SDK/MapLibre race constraints.
const applySelectedIndex = async (
    state: ToolState,
    entryIds: readonly string[],
    selectedIndex: number,
): Promise<void> => {
    if (selectedIndex === 0) return;
    for (const id of entryIds) {
        const entry = state.routing.entries.find((e) => e.id === id);
        if (!entry) continue;
        const module = await state.routing.getEntryRoutingModule(id);
        await module.showRoutes(entry.data, { selectedIndex });
        if (entry.waypoints.length) await module.showWaypoints(entry.waypoints);
    }
};

// Apply the requested add / remove / clear / selectedIndex sequence and return the
// before/after shown sets so the response layer can compute deltas. Sequential awaits — concurrent
// show/hide on the routing slice races MapLibre's style mutation.
const applyAddRemove = async (
    state: ToolState,
    plan: { add: readonly string[]; remove: readonly string[]; clear: boolean; selectedIndex: number | undefined },
): Promise<{ beforeShown: Set<string>; afterShown: ReadonlySet<string> }> => {
    const beforeShown = new Set(state.routing.shownEntryIds);
    if (plan.clear) {
        for (const id of state.routing.shownEntryIds) {
            await state.routing.hideEntry(id);
        }
    }
    for (const id of plan.remove) {
        await state.routing.hideEntry(id);
    }
    for (const id of plan.add) {
        await state.routing.showEntry(id);
    }
    if (plan.selectedIndex !== undefined) {
        await applySelectedIndex(state, plan.add, plan.selectedIndex);
    }
    return { beforeShown, afterShown: state.routing.shownEntryIds };
};

// Fit the camera around every currently-shown route. No-op when nothing is shown or the joined
// feature collection has no computable bbox.
const fitCameraToShown = (state: ToolState, shownIds: ReadonlySet<string>): void => {
    const features: Routes['features'] = [];
    for (const entry of state.routing.entries) {
        if (shownIds.has(entry.id)) features.push(...entry.data.features);
    }
    if (features.length === 0) return;
    const bbox = bboxFromGeoJSON({ type: 'FeatureCollection', features });
    if (bbox) {
        state.baseMap.mapLibreMap.fitBounds(bbox as LngLatBoundsLike, { padding: 50 });
    }
};

export const executeUpdateRoutesDisplay = async (
    params: z.infer<typeof updateRoutesDisplaySchema>,
    state: ToolState,
): Promise<z.infer<typeof updateRoutesDisplayOutputSchema>> => {
    const { clear, selectedIndex, fitBounds, mainColor } = params;
    try {
        const selectors = resolveSelectors(state, params);
        if ('error' in selectors) return selectors;
        const { add: resolvedAdd, remove: resolvedRemove } = selectors;

        // Persist mainColor BEFORE add/remove so newly-shown entries pick it up on first paint,
        // and apply to whatever is already on the map. Sticky for the lifetime of the slice.
        if (mainColor !== undefined) {
            state.routing.setMainColor(mainColor);
        }

        const { beforeShown, afterShown } = await applyAddRemove(state, {
            add: resolvedAdd,
            remove: resolvedRemove,
            clear: !!clear,
            selectedIndex,
        });

        const actuallyAdded = resolvedAdd.filter((id) => !beforeShown.has(id) && afterShown.has(id));
        const actuallyRemoved = resolvedRemove.filter((id) => beforeShown.has(id) && !afterShown.has(id));

        if (fitBounds ?? resolvedAdd.length > 0) {
            fitCameraToShown(state, afterShown);
        }

        const shownWithLabels = state.routing.entries
            .filter((entry) => afterShown.has(entry.id))
            .map((entry) => ({
                id: entry.id,
                label: entry.label,
                routeCount: entry.data.features.length,
                selectedIndex: actuallyAdded.includes(entry.id) ? (selectedIndex ?? 0) : 0,
            }));

        const currentMainColor = state.routing.mainColor;
        return {
            success: true as const,
            totalShown: afterShown.size,
            shown: shownWithLabels,
            actuallyAdded,
            actuallyRemoved,
            ...(currentMainColor !== undefined && { mainColor: currentMainColor }),
        };
    } catch (error) {
        return {
            error: `updateRoutesDisplay failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
