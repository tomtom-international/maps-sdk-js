/**
 * @module agent-toolkit-tools
 *
 * Shared input schema building blocks reused across multiple tools.
 */

import { z } from 'zod';

/** @ignore */
export const geoJsonBBoxSchema = z
    .union([z.array(z.number()).refine((arr) => arr.length === 4, { message: 'BBox must have 4 elements' })])
    .describe('[minLng, minLat, maxLng, maxLat] or [W,S,E,N]');

/** @ignore */
export const hasBBoxSchema = z.union([geoJsonBBoxSchema, z.object({ bbox: geoJsonBBoxSchema })]);

/** @ignore */
export const showPlacesSchema = z.object({
    markerType: z
        .enum(['pin', 'none'])
        .describe(
            'Marker type to show on the map. Show a marker only for addresses and small POIs. Use "none" towns, cities, or any areas or regions.',
        ),
    zoomMode: z
        .enum(['auto', 'none'])
        .describe('How to zoom the map into the places. Use "none" to keep the map still.'),
    mode: z
        .enum(['add', 'replace'])
        .optional()
        .describe(
            'Display mode. Default: "replace" (clears existing pins, shows only these). ' +
                'Use "add" when the user wants to STACK these results on top of what is already shown ("also show", "additionally", "and X").',
        ),
});

/** @ignore */
export const shownSchema = z.object({
    markerType: z.boolean(),
    zoomMode: z.boolean(),
});

/** @ignore */
export const whereSchema = z.union([
    z.object({ position: z.array(z.number()).length(2) }).describe('Bias toward a specific [lng, lat] point.'),
    z.object({ boundingBox: hasBBoxSchema }).describe('Consider only within a BBox [W,S,E,N] or GeoJSON with bbox.'),
    z.literal('within-map-bounds').describe('Consider within the current map viewport bounds.'),
    z.literal('nearby-map-center').describe('Bias toward the current map center.'),
    z.literal('global').describe('No geographic bias — global search.'),
    z
        .string()
        .describe(
            'Place name or area (e.g. "Paris", "Manhattan") — geocoded first, then its bbox or position is used as bias.',
        ),
]);
