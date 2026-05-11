/**
 * @module agent-toolkit-tools
 */

import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { geometryDisplayConfigSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

type GeometryDisplayConfig = z.infer<typeof geometryDisplayConfigSchema>;
type GeometrySkip = { placeId: string; reason: string };

// Renders boundary polygons for the given entries via each entry's GeometriesModule.
// Place ids outside the targeted entries are ignored — see `geometryDisplayConfigSchema`.
const applyGeometryDisplay = async (
    state: ToolState,
    entryIds: readonly string[],
    config: GeometryDisplayConfig,
): Promise<{ rendered: number; skipped: GeometrySkip[] }> => {
    const theme = config.theme ?? 'outline';
    const mode = config.mode ?? 'replace';
    const placeIdFilter = config.placeIds ? new Set(config.placeIds) : undefined;

    const skipped: GeometrySkip[] = [];
    let rendered = 0;

    for (const entryId of entryIds) {
        const entry = state.places.entries.find((e) => e.id === entryId);
        if (!entry) continue;

        const targetPlaces = placeIdFilter ? entry.places.filter((p) => placeIdFilter.has(p.id)) : entry.places;

        const features = [];
        for (const place of targetPlaces) {
            if (!place.properties.dataSources?.geometry?.id) {
                skipped.push({
                    placeId: place.id,
                    reason: 'Place has no geometry data source (e.g. addresses and streets often lack one).',
                });
                continue;
            }
            try {
                const feature = await state.places.fetchPlaceGeometry(place.id);
                if (!feature) {
                    skipped.push({
                        placeId: place.id,
                        reason: 'Geometry Data service returned no feature for this place.',
                    });
                    continue;
                }
                features.push(feature);
            } catch (error) {
                skipped.push({
                    placeId: place.id,
                    reason: `Geometry fetch failed: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }

        if (features.length > 0) {
            await state.places.showPlaceGeometries(features, theme, mode, entryId);
            rendered += features.length;
        }
    }

    return { rendered, skipped };
};

const shownEntrySummarySchema = z.object({
    id: z.string(),
    label: z.string(),
    featureCount: z.number(),
    markerType: z.enum(['pin', 'base-map', 'pin-clustered']).describe('How the entry is rendered on the map.'),
});

export const updatePlacesDisplayOutputSchema = z.union([
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
        geometriesRendered: z
            .number()
            .optional()
            .describe('Number of boundary polygons rendered when `geometry` was set.'),
        geometriesSkipped: z
            .array(z.object({ placeId: z.string(), reason: z.string() }))
            .optional()
            .describe('Places whose boundary could not be rendered (no geometry data source, fetch failure).'),
    }),
    toolErrorSchema,
]);

export const updatePlacesDisplaySchema = z
    .object({
        add: z
            .array(z.string())
            .optional()
            .describe(
                'Entry ids to show (e.g. ["places-1"]). ' +
                    'Omit while still setting `markerType` or `geometry` to target the most recently stored entry.',
            ),
        remove: z.array(z.string()).optional().describe('Entry ids to hide.'),
        addMatching: z.array(z.string()).optional().describe('Category labels to show.'),
        removeMatching: z.array(z.string()).optional().describe('Category labels to hide.'),
        clear: z.boolean().optional().describe('Hide every displayed entry.'),
        markerType: z
            .enum(['pin', 'base-map', 'pin-clustered'])
            .optional()
            .describe(
                'How newly-added entries are rendered as markers: "pin", "base-map", or "pin-clustered" (pins with a count badge ' +
                    'where nearby ones aggregate). ' +
                    'Defaults to "pin" unless `geometry` is set without an explicit `markerType`, in which case markers are skipped. ' +
                    'Entries previously shown with another marker type are moved to this one.',
            ),
        geometry: geometryDisplayConfigSchema.optional(),
        fitBounds: z
            .boolean()
            .optional()
            .describe(
                'Pan/zoom to fit the resulting display. Defaults to true when entries are being added, false otherwise.',
            ),
    })
    .refine(
        (data) =>
            data.add !== undefined ||
            data.remove !== undefined ||
            data.addMatching !== undefined ||
            data.removeMatching !== undefined ||
            data.clear === true ||
            data.markerType !== undefined ||
            data.geometry !== undefined,
        {
            message:
                'updatePlacesDisplay requires at least one of: add, remove, addMatching, removeMatching, clear, markerType, geometry.',
        },
    );

export const updatePlacesDisplayDescription =
    'Show, hide, and swap which places entries are displayed on the map in one atomic call. ' +
    'Target entries by id (`add` / `remove`) or by category label (`addMatching` / `removeMatching`). ' +
    '`clear` hides every currently-shown entry; combine with `add` to swap the display ("hide everything, show these"). ' +
    'Markers (`markerType`) and boundary polygons (`geometry`) are independent display channels — set either or both for the targeted entries. ' +
    'Omit `add`/`addMatching` while still setting `markerType` or `geometry` to target the most recently stored entry. ' +
    'Does not delete from history.';

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

// When markerType is implicit, leave entries that are already shown alone — otherwise an
// "add cafes" call would demote a previously-clustered entry to pin. Explicit markerType
// is treated as an intentional override and applies to every id.
const applyMarkerAdds = async (
    state: ToolState,
    addIds: readonly string[],
    markerType: 'pin' | 'base-map' | 'pin-clustered' | undefined,
    beforeShown: ReadonlySet<string>,
): Promise<void> => {
    const markerIds = markerType !== undefined ? addIds : addIds.filter((id) => !beforeShown.has(id));
    if (markerIds.length > 0) {
        await state.places.addShownEntries(markerIds, markerType ?? 'pin');
    }
};

type ResolvedSelectors = { add: string[]; remove: string[] } | { error: string };

// Resolves the user-provided selectors into the concrete entry-id sets we'll act on. Handles
// label-matching, the implicit "latest entry" fallback when only a display signal is set, and
// the unknown-id check that gates the rest of the executor.
const resolveSelectors = (state: ToolState, params: z.infer<typeof updatePlacesDisplaySchema>): ResolvedSelectors => {
    const { add, remove, addMatching, removeMatching, markerType, geometry } = params;
    let resolvedAdd = [...(add ?? []), ...resolveMatchingIds(state, addMatching ?? [])];
    const resolvedRemove = [...(remove ?? []), ...resolveMatchingIds(state, removeMatching ?? [])];

    const implicitLatest =
        add === undefined && addMatching === undefined && (markerType !== undefined || geometry !== undefined);
    if (implicitLatest) {
        const latestId = state.places.entries.at(-1)?.id;
        if (!latestId) {
            return {
                error: 'No places available to display. Resolve a place or run a search first (e.g. discoverPlaces).',
            };
        }
        resolvedAdd = [latestId];
    }

    const knownIds = new Set(state.places.entries.map((entry) => entry.id));
    const unknownAdd = resolvedAdd.filter((id) => !knownIds.has(id));
    if (unknownAdd.length > 0) {
        return {
            error: `Unknown places entry ids: ${unknownAdd.join(', ')}. Use recallPlaces to list available entries.`,
        };
    }
    return { add: resolvedAdd, remove: resolvedRemove };
};

export const executeUpdatePlacesDisplay = async (
    params: z.infer<typeof updatePlacesDisplaySchema>,
    state: ToolState,
): Promise<z.infer<typeof updatePlacesDisplayOutputSchema>> => {
    const { clear, markerType, geometry, fitBounds } = params;
    try {
        const selectors = resolveSelectors(state, params);
        if ('error' in selectors) return selectors;
        const { add: resolvedAdd, remove: resolvedRemove } = selectors;

        // Snapshot the shown set BEFORE mutation so we can report diffs accurately.
        const beforeShown = new Set(state.places.shownEntryIds);

        if (clear) {
            await state.places.clearShownEntries();
            await state.places.clearShownGeometries();
        }
        if (resolvedRemove.length > 0) {
            await state.places.removeShownEntries(resolvedRemove);
            await state.places.clearShownGeometries(resolvedRemove);
        }
        // Markers default to 'pin' unless `geometry` was set with no explicit markerType,
        // in which case the user wants boundaries only.
        const renderMarkers = markerType !== undefined || !geometry;
        if (resolvedAdd.length > 0 && renderMarkers) {
            await applyMarkerAdds(state, resolvedAdd, markerType, beforeShown);
        }

        let geometryResult: { rendered: number; skipped: GeometrySkip[] } | undefined;
        if (geometry && resolvedAdd.length > 0) {
            geometryResult = await applyGeometryDisplay(state, resolvedAdd, geometry);
        }

        const afterShown = state.places.shownEntryIds;
        const actuallyAdded = resolvedAdd.filter((id) => !beforeShown.has(id) && afterShown.has(id));
        const actuallyRemoved = resolvedRemove.filter((id) => beforeShown.has(id) && !afterShown.has(id));

        const shouldFit = fitBounds ?? resolvedAdd.length > 0;
        const shownFeatures = state.places.getShownFeatures();
        if (shouldFit && shownFeatures.length > 0) {
            const bbox = bboxFromGeoJSON(shownFeatures);
            if (bbox) {
                state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 50 });
            }
        }

        const shownWithLabels = state.places.entries
            .filter((entry) => afterShown.has(entry.id))
            .map((entry) => ({
                id: entry.id,
                label: entry.label,
                featureCount: entry.places.length,
                markerType: state.places.getShownMarkerType(entry.id) ?? 'pin',
            }));

        return {
            success: true as const,
            totalShown: shownFeatures.length,
            shown: shownWithLabels,
            actuallyAdded,
            actuallyRemoved,
            ...(geometryResult && { geometriesRendered: geometryResult.rendered }),
            ...(geometryResult?.skipped.length && { geometriesSkipped: geometryResult.skipped }),
        };
    } catch (error) {
        return {
            error: `updatePlacesDisplay failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
