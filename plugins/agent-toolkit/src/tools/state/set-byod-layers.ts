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
                'MapLibre PAINT properties — how the feature LOOKS: colour, opacity, halo, blur (any `*-color` / ' +
                    '`*-opacity` / `*-halo-*`), plus `circle-radius` and `line-width`. Values may be data-driven ' +
                    'expressions referencing feature properties seen in the entry `profile` (e.g. ' +
                    '`["interpolate", ["linear"], ["get", "revenue"], 0, 4, 1000, 20]`).',
            ),
        layout: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                'MapLibre LAYOUT properties — WHAT/WHERE the feature is: `visibility`, placement/anchor/offset, and ' +
                    "a symbol's text/icon content + glyph sizing (`text-field`, `text-font`, `text-size`, " +
                    '`icon-image`, `icon-size`). Everything else — all colour, opacity and halo — is `paint`. A ' +
                    '`symbol` splits its text styling this way (`text-field`/`text-size` here, ' +
                    '`text-color`/`text-halo-*` in `paint`); mixing them up makes MapLibre reject the layer with ' +
                    '`unknown property`.',
            ),
        filter: z
            .unknown()
            .optional()
            .describe('Optional MapLibre filter expression restricting which features this layer renders.'),
        id: z.string().optional().describe('Stable layer id. Auto-generated when omitted.'),
        beforeID: z.string().optional().describe('Id of an existing map layer to insert this layer before.'),
    })
    .describe('A single MapLibre layer rendering the entry. Pick `type` by geometry; drive `paint` from the profile.');

export const setByodLayersSchema = z.object({
    byodEntryId: z.string().describe('Id of the BYOD entry to restyle (from `addByodSource` or `recallState`).'),
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
    'Replace the MapLibre layers a BYOD entry renders under, styling customer data from its `profile` ' +
    '(geometry types + per-property types/coverage/examples). Operates on an entry already in state ' +
    '(`addByodSource` / `recallState`); the supplied `layers` replace the current set wholesale, applying live in ' +
    'place if the entry is shown. Pass `show` to render a hidden entry or re-fit the camera. Invalid specs leave ' +
    "the entry unchanged and return an error to retry, so the entry's styling is never lost. " +
    'This is the SECOND STEP OF EVERY BYOD INGEST and the ONLY way a BYOD entry becomes visible — `addByodSource` ' +
    'creates the entry with NO layers — so always call it to pick layers that fit the detected schema: graduate ' +
    '`circle-radius`/colour by a numeric field (`interpolate`), colour a `fill`/`line` by a categorical field ' +
    '(`match`), or switch dense points to `symbol`; even with no dominant property, choose legible layers for the ' +
    'geometry. ' +
    'STYLE FOR LEGIBILITY ON THE TOMTOM BASEMAP (no need to inspect the style): translucent `fill` ' +
    '(`fill-opacity` ~0.3–0.5) with a contrasting `fill-outline-color`; `symbol` text with a white halo ' +
    "(`text-halo-color: '#ffffff'` + `text-halo-width` ~1.5 in `paint`, while `text-field`/`text-size` ~12 go in " +
    '`layout`); `circle` with a thin white stroke (`circle-stroke-color`/`-width`); a small, high-contrast palette ' +
    'that avoids fully opaque black or white fills.';

export const executeSetByodLayers = async (
    params: z.infer<typeof setByodLayersSchema>,
    state: ToolState,
): Promise<z.infer<typeof setByodLayersOutputSchema>> => {
    const entry = state.byod.findById(params.byodEntryId);
    if (!entry) {
        return {
            error: `No BYOD entry with id "${params.byodEntryId}". Call recallState to list available IDs.`,
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
