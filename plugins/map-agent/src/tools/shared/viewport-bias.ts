/**
 * @module map-agent-tools
 *
 * Utility for deriving a search bias from the current map viewport.
 */

import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { BaseMapState } from '../../state';

/**
 * Minimum zoom level at which the viewport center is considered a meaningful
 * geographic bias. Below this level the map is zoomed too far out to provide
 * a useful locality signal (e.g. the center might be over an ocean).
 */
export const MIN_VIEWPORT_BIAS_ZOOM = 6;

/**
 * Returns the current map center as a `Position` bias
 * when the map is zoomed in at or beyond `minZoom`, otherwise returns `undefined`.
 *
 * Use this to automatically bias fuzzy searches (locatePlace)
 * toward the user's current map area without requiring the LLM to call getViewport.
 */
export function getViewportBias(map: BaseMapState, minZoom = MIN_VIEWPORT_BIAS_ZOOM): Position | undefined {
    const zoom = map.mapLibreMap.getZoom();
    if (zoom < minZoom) return undefined;
    const center = map.mapLibreMap.getCenter();
    return [center.lng, center.lat];
}

/**
 * Returns the current map bounds as a `BBox` `[west, south, east, north]`.
 *
 * Use this to automatically bias discovery searches (discoverPlaces)
 * toward the user's current map area without requiring the LLM to call getViewport.
 */
export function getViewportBoundingBox(map: BaseMapState): BBox {
    const bounds = map.mapLibreMap.getBounds();
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}
