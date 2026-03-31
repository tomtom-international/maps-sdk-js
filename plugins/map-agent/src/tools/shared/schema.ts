/**
 * @module map-agent-tools
 *
 * Shared input schema building blocks reused across multiple tools.
 */

import { z } from 'zod';

/**
 * GeoJSON bounding box schema.
 */
export const geoJsonBBoxSchema = z
    .union([z.array(z.number()).refine((arr) => arr.length === 4, { message: 'BBox must have 4 elements' })])
    .describe('[minLng, minLat, maxLng, maxLat] or [W,S,E,N]');

/**
 * HasBBox schema — either a BBox array or a GeoJSON object with a bbox property.
 */
export const hasBBoxSchema = z.union([geoJsonBBoxSchema, z.object({ bbox: geoJsonBBoxSchema })]);

/**
 * Optional map display actions after resolving a place or places.
 */
export const showPlacesSchema = z.object({
    markerType: z
        .enum(['pin', 'none'])
        .describe(
            'Marker type to show on the map. Show a marker only for addresses and small POIs. Use "none" towns, cities, or any areas or regions.',
        ),
    zoomMode: z
        .enum(['auto', 'none'])
        .describe('How to zoom the map into the places. Use "none" to keep the map still.'),
});

/** Output fields reporting which display actions were applied. */
export const shownSchema = z.object({
    markerType: z.boolean(),
    zoomMode: z.boolean(),
});

/**
 * Geographic scope for a search — explicit coordinates, an explicit bounding box,
 * or a map-relative shorthand.
 */
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
