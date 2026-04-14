/**
 * @module agent-toolkit-tools
 *
 * Utility for deriving a search bias from the current map viewport.
 */

import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import type { BaseMapState } from '../../state';

/** @ignore */
export const MIN_VIEWPORT_BIAS_ZOOM = 6;

/** @ignore */
export const getViewportBias = (map: BaseMapState, minZoom = MIN_VIEWPORT_BIAS_ZOOM): Position | undefined => {
    const zoom = map.mapLibreMap.getZoom();
    if (zoom < minZoom) return undefined;
    const center = map.mapLibreMap.getCenter();
    return [center.lng, center.lat];
};

/** @ignore */
export const getViewportBoundingBox = (map: BaseMapState): BBox => {
    const bounds = map.mapLibreMap.getBounds();
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
};
