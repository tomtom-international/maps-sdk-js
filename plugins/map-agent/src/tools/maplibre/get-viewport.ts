/**
 * @module map-agent-tools
 */

import { z } from 'zod';
import type { ToolState } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';

/** Output schema for the get-viewport tool. */
export const getViewportOutputSchema = z.union([
    z.object({
        center: z.array(z.number()).describe('[lng, lat]'),
        zoom: z.number().describe('0–22'),
        bbox: z.array(z.number()).describe('[W, S, E, N]'),
        pitch: z.number().describe('degrees, 0=top-down, 85=near-horizontal'),
        bearing: z.number().describe('degrees, 0=north, 90=east'),
    }),
    toolErrorSchema,
]);

/**
 * Tool schema for getting viewport.
 */
export const getViewportSchema = z.object({});

export const getViewportDescription =
    'Get the current map viewport: center coordinates [longitude, latitude], zoom level, and bounding box [minLng, minLat, maxLng, maxLat]. ' +
    'Use for queries referencing the map view: "in this area", "what I can see", "near the map center". ' +
    'Does NOT return the user\'s physical location — use getCurrentLocation for "near me" queries. ' +
    'Reads map state. Does not call any service.';

/** Execute function for getViewport — usable with ToolEntry format. */
export async function executeGetViewport(_params: z.infer<typeof getViewportSchema>, state: ToolState) {
    try {
        const mapLibreMap = state.baseMap.mapLibreMap;
        return {
            center: mapLibreMap.getCenter().toArray(),
            zoom: mapLibreMap.getZoom(),
            bbox: state.baseMap.ttMap.getBBox(),
            pitch: mapLibreMap.getPitch(),
            bearing: mapLibreMap.getBearing(),
        };
    } catch (error) {
        return {
            error: `Failed to get viewport: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
