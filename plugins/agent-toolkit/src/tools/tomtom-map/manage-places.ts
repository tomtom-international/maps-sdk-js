/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

const shownEntrySummarySchema = z.object({
    id: z.string(),
    label: z.string(),
    featureCount: z.number(),
});

export const managePlacesOutputSchema = z.union([
    z.object({
        success: z.literal(true),
        totalShown: z.number(),
        shown: z.array(shownEntrySummarySchema).describe('Entries currently on the map, with their labels.'),
        actuallyAdded: z
            .array(z.string())
            .describe('Ids from `add` / `addMatching` that were not already shown. Empty if it was a no-op.'),
        actuallyRemoved: z
            .array(z.string())
            .describe('Ids from `remove` / `removeMatching` that were actually on the map. Empty if no-op.'),
    }),
    toolErrorSchema,
]);

export const managePlacesSchema = z
    .object({
        add: z.array(z.string()).optional().describe('Entry ids to show (e.g. ["places-1"]).'),
        remove: z.array(z.string()).optional().describe('Entry ids to hide.'),
        addMatching: z
            .array(z.string())
            .optional()
            .describe('Category labels to show.'),
        removeMatching: z
            .array(z.string())
            .optional()
            .describe('Category labels to hide.'),
        clear: z.boolean().optional().describe('Hide every displayed entry.'),
        fitBounds: z.boolean().optional().describe('Pan/zoom to fit the resulting display. Default: false.'),
    })
    .refine(
        (data) =>
            data.add !== undefined ||
            data.remove !== undefined ||
            data.addMatching !== undefined ||
            data.removeMatching !== undefined ||
            data.clear === true,
        { message: 'managePlaces requires at least one of: add, remove, addMatching, removeMatching, clear.' },
    );

export const managePlacesDescription =
    'Change which places entries are displayed on the map. ' +
    'Target entries by id (`add` / `remove`) or by category label (`addMatching` / `removeMatching`). ' +
    '`clear` hides all. Does not delete from history.';

/** Resolve category terms to entry ids by case-insensitive substring match on the entry label. */
const resolveMatchingIds = (state: ToolState, terms: readonly string[]): string[] => {
    if (terms.length === 0) return [];
    const needles = terms.map((term) => term.toLowerCase());
    const matched = new Set<string>();
    for (const entry of state.places.entries) {
        const label = entry.label.toLowerCase();
        if (needles.some((needle) => label.includes(needle))) {
            matched.add(entry.id);
        }
    }
    return [...matched];
};

export const executeManagePlaces = async (
    params: z.infer<typeof managePlacesSchema>,
    state: ToolState,
): Promise<z.infer<typeof managePlacesOutputSchema>> => {
    const { add, remove, addMatching, removeMatching, clear, fitBounds = false } = params;
    try {
        // Resolve label-matching selectors to concrete ids, merge with id-based selectors.
        const resolvedAdd = [...(add ?? []), ...resolveMatchingIds(state, addMatching ?? [])];
        const resolvedRemove = [...(remove ?? []), ...resolveMatchingIds(state, removeMatching ?? [])];

        const knownIds = new Set(state.places.entries.map((entry) => entry.id));
        const unknownAdd = resolvedAdd.filter((id) => !knownIds.has(id));
        if (unknownAdd.length > 0) {
            return {
                error: `Unknown places entry ids: ${unknownAdd.join(', ')}. Use recallPlaces to list available entries.`,
            };
        }

        // Snapshot the shown set BEFORE mutation so we can report diffs accurately.
        const beforeShown = new Set(state.places.shownEntryIds);

        if (clear) {
            await state.places.clearShownEntries();
        }
        if (resolvedRemove.length > 0) {
            await state.places.removeShownEntries(resolvedRemove);
        }
        if (resolvedAdd.length > 0) {
            await state.places.addShownEntries(resolvedAdd);
        }

        const afterShown = state.places.shownEntryIds;
        const actuallyAdded = resolvedAdd.filter((id) => !beforeShown.has(id) && afterShown.has(id));
        const actuallyRemoved = resolvedRemove.filter((id) => beforeShown.has(id) && !afterShown.has(id));

        const shownFeatures = state.places.getShownFeatures();
        if (fitBounds && shownFeatures.length > 0) {
            const bbox = bboxFromGeoJSON(shownFeatures);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
            }
        }

        const shownWithLabels = state.places.entries
            .filter((entry) => afterShown.has(entry.id))
            .map((entry) => ({ id: entry.id, label: entry.label, featureCount: entry.data.length }));

        return {
            success: true as const,
            totalShown: shownFeatures.length,
            shown: shownWithLabels,
            actuallyAdded,
            actuallyRemoved,
        };
    } catch (error) {
        return {
            error: `managePlaces failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
