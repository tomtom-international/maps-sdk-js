/**
 * @module agent-toolkit-tools
 *
 * Shared `fitOnMap` directive for sandboxed `process-*` tools — the LLM-authored
 * code can return a bbox (or `{ bbox, padding?, animate? }`) and the tool will
 * fit the camera to it without persisting any state. Lets the model use a
 * process-* tool purely for "compute → focus the map" without first writing a
 * new entry.
 */

import type { BBox } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import type { ToolState } from '../../types';

/** @ignore */
export const fitOnMapInputSchema = z
    .union([
        z.tuple([z.number(), z.number(), z.number(), z.number()]),
        z.object({
            bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
            padding: z.number().optional(),
            animate: z.boolean().optional(),
        }),
    ])
    .describe(
        'Bounds to fit the camera to: a `[W, S, E, N]` BBox tuple, or `{ bbox: [W,S,E,N], padding?: number, animate?: boolean }`. ' +
            'Default padding: 50px.',
    );

/** @ignore */
export const fittedReportSchema = z.object({
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).describe('Bounds the camera was fit to.'),
    padding: z.number().describe('Padding (px) applied around the bbox.'),
});

/** @ignore */
export type FitOnMapInput = BBox | { bbox: BBox; padding?: number; animate?: boolean };

/** Doc blurb to inline in sandboxed-code descriptions. @ignore */
export const FIT_ON_MAP_DOC =
    '`fitOnMap` (opt): `[W,S,E,N]` BBox or `{ bbox: [W,S,E,N], padding?: number, animate?: boolean }` ' +
    '(default padding 50). Camera fits these bounds after the tool runs. Returning ONLY `fitOnMap` skips ' +
    'state writes (pure camera focus); combine with `places` / `geometries` to also write+focus. ' +
    'Derive bboxes via `turf.bbox(feature | FeatureCollection)`.';

const isBBoxTuple = (value: unknown): value is BBox =>
    Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === 'number' && Number.isFinite(n));

/** @ignore */
export const isFitOnMapInput = (value: unknown): value is FitOnMapInput => {
    if (isBBoxTuple(value)) return true;
    if (!value || typeof value !== 'object') return false;
    const v = value as { bbox?: unknown; padding?: unknown; animate?: unknown };
    if (!isBBoxTuple(v.bbox)) return false;
    if (v.padding !== undefined && (typeof v.padding !== 'number' || !Number.isFinite(v.padding))) return false;
    return !(v.animate !== undefined && typeof v.animate !== 'boolean');
};

/**
 * Apply a sandbox-returned `fitOnMap` directive: move the camera to the bbox
 * with the requested padding/animation, and return a normalized record for
 * the tool's output payload.
 *
 * @ignore
 */
export const applyFitOnMap = (state: ToolState, fit: FitOnMapInput): z.infer<typeof fittedReportSchema> => {
    const bbox = isBBoxTuple(fit) ? fit : fit.bbox;
    const padding = (isBBoxTuple(fit) ? undefined : fit.padding) ?? 50;
    const animate = isBBoxTuple(fit) ? undefined : fit.animate;
    state.baseMap.mapLibreMap.fitBounds(bbox, { padding, ...(animate !== undefined && { animate }) });
    return { bbox, padding };
};
