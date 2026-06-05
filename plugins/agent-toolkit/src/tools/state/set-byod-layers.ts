/**
 * @module agent-toolkit-tools
 */

import type { CustomGeoJSONLayerSpec } from '@tomtom-org/maps-sdk/map';
import { z } from 'zod';
import type { ToolState } from '../../types';
import { showByodOnMap, showByodSchema, shownByodSchema } from '../shared';
import { toolErrorSchema } from '../shared-output-schemas';

// Loose, structural mirror of `CustomGeoJSONLayerSpec` (a MapLibre layer spec minus `source`/`id`).
// We deliberately accept raw MapLibre `paint` / `layout` / `filter` as pass-through bags rather than
// re-typing the full MapLibre union here: the model gets the same expressive power it has in the SDK,
// and invalid specs are caught at render time (MapLibre throws → we return a semantic tool error).
const byodLayerTypeSchema = z
    .enum(['circle', 'line', 'fill', 'symbol', 'heatmap', 'fill-extrusion'])
    .describe(
        'MapLibre layer type. Must suit the geometry: Point → circle/symbol/heatmap, Line → line, Polygon → fill/fill-extrusion.',
    );

const byodLayerSpecSchema = z
    .object({
        type: byodLayerTypeSchema,
        paint: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                'MapLibre paint properties for this layer `type` (e.g. circle → `circle-radius` / `circle-color`, ' +
                    'fill → `fill-color` / `fill-opacity`, line → `line-color` / `line-width`). Values may be data-driven ' +
                    'expressions referencing feature properties seen in the entry `profile` (e.g. ' +
                    '`["interpolate", ["linear"], ["get", "revenue"], 0, 4, 1000, 20]`).',
            ),
        layout: z
            .record(z.string(), z.unknown())
            .optional()
            .describe('MapLibre layout properties (e.g. symbol `icon-image` / `text-field`, or `visibility`).'),
        filter: z
            .unknown()
            .optional()
            .describe('Optional MapLibre filter expression restricting which features this layer renders.'),
        id: z.string().optional().describe('Stable layer id. Auto-generated when omitted.'),
        beforeID: z.string().optional().describe('Id of an existing map layer to insert this layer before.'),
    })
    .describe('A single MapLibre layer rendering the entry. Pick `type` by geometry; drive `paint` from the profile.');

export const setByodLayersSchema = z.object({
    byodEntryId: z.string().describe('Id of the BYOD entry to restyle (from `addByodSource` or `recallByod`).'),
    layers: z
        .array(byodLayerSpecSchema)
        .min(1)
        .describe(
            'Replacement MapLibre layer specs, applied in array order (first drawn underneath). Replaces the ' +
                "entry's current layers wholesale. Use the entry `profile` (geometry types + per-property " +
                'types/coverage/examples) to choose layer `type`s and data-driven `paint`.',
        ),
    show: showByodSchema
        .optional()
        .describe(
            'Render the entry after restyling. Omit when the entry is already shown — the new layers apply live ' +
                'in place. Pass it to render a hidden entry (or to re-fit the camera via `zoomMode`).',
        ),
});

export const setByodLayersOutputSchema = z.union([
    z.object({
        byodEntryId: z.string(),
        label: z.string(),
        layerCount: z.number().describe('Number of layers now configured on the entry.'),
        layerTypes: z.array(z.string()).describe('The `type` of each configured layer, in draw order.'),
        shown: shownByodSchema
            .optional()
            .describe('Render report — present only when `show` was provided (or the entry re-rendered live).'),
    }),
    toolErrorSchema,
]);

export const setByodLayersDescription =
    'Replace the MapLibre layers a BYOD entry renders under, so the model can style customer data based on its ' +
    '`profile` (geometry types + per-property types/coverage/examples) — e.g. graduate `circle-radius` by a numeric ' +
    'field, colour a `fill` by category, or switch a Point layer to `symbol`. Operates on an entry already in state ' +
    '(from `addByodSource` / `recallByod`); the supplied `layers` replace the current set wholesale. If the ' +
    'entry is already on the map the new layers apply live in place; pass `show` to render a hidden entry or re-fit ' +
    'the camera. Invalid layer specs leave the entry unchanged and return an error to correct and retry — so the ' +
    "entry's previous styling is never lost. " +
    'This is the SECOND STEP OF EVERY BYOD INGEST and the ONLY way a BYOD entry becomes visible: `addByodSource` ' +
    'creates the entry with NO layers (nothing is drawn), so you must call this to decide the layers that fit the ' +
    'detected schema, in all cases. Read the `profile` and encode whatever the data offers: graduate ' +
    '`circle-radius`/colour by a numeric field via an `interpolate` expression, colour a `fill`/`line` by a ' +
    'categorical field via a `match` expression, or switch dense points to a `symbol`. Even when no single property ' +
    'dominates, choose sensible, legible layers suited to the geometry. ' +
    'STYLE FOR LEGIBILITY ON THE TOMTOM BASEMAP (no need to inspect the style): keep `fill` translucent ' +
    "(`fill-opacity` ~0.3–0.5) with a contrasting `fill-outline-color` so the basemap's roads and labels show " +
    "through; give any `symbol` text a light halo (`text-halo-color: '#ffffff'`, `text-halo-width` ~1.5) at a modest " +
    '`text-size` (~12, matching basemap labels); give `circle` a thin white stroke (`circle-stroke-color`/`-width`); ' +
    'and pick a small, high-contrast palette — avoid fully opaque pure black or white fills that fight the map.';

export const executeSetByodLayers = async (
    params: z.infer<typeof setByodLayersSchema>,
    state: ToolState,
): Promise<z.infer<typeof setByodLayersOutputSchema>> => {
    const entry = state.byod.findById(params.byodEntryId);
    if (!entry) {
        return {
            error: `No BYOD entry with id "${params.byodEntryId}". Call recallByod to list available IDs.`,
        };
    }

    // Snapshot the current layers so an invalid spec can be rolled back — applyConfig mutates the
    // live module before MapLibre may reject a paint expression, so a failed restyle must not leave
    // the entry half-styled.
    const previousLayers = entry.layers;
    // The structural schema is intentionally looser than the strict MapLibre union; cast at the
    // boundary and lean on MapLibre's own validation (surfaced as a tool error below).
    const nextLayers = params.layers as CustomGeoJSONLayerSpec[];

    try {
        state.byod.setEntryLayers(params.byodEntryId, nextLayers);
    } catch (error) {
        // Roll back to the known-good previous specs. setEntryLayers re-applies them to the live
        // module; if the module itself is now wedged, fall back to restoring just the stored specs
        // so the entry stays internally consistent and the original error is not masked.
        try {
            state.byod.setEntryLayers(params.byodEntryId, previousLayers);
        } catch {
            entry.layers = previousLayers;
        }
        return {
            error: `Failed to apply layers to "${params.byodEntryId}": ${
                error instanceof Error ? error.message : String(error)
            }. The entry keeps its previous layers — fix the layer specs and retry.`,
        };
    }

    let shown: z.infer<typeof shownByodSchema> | undefined;
    if (params.show) {
        try {
            shown = await showByodOnMap(state, params.byodEntryId, params.show);
        } catch (error) {
            return {
                error: `Layers applied to "${params.byodEntryId}" but rendering failed: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            };
        }
    }

    return {
        byodEntryId: params.byodEntryId,
        label: entry.label,
        layerCount: nextLayers.length,
        layerTypes: nextLayers.map((layer) => layer.type),
        ...(shown && { shown }),
    };
};
