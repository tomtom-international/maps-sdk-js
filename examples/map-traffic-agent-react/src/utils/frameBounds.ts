import type { LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';

/** Gap (px) kept around framed content on the open-map edges. */
const EDGE_PADDING = 80;
/** Fallback left inset when the panel rail can't be measured (≈ the rail's max width). */
const FALLBACK_RAIL_INSET = 340;

/**
 * Frame a bbox on the map while keeping the result clear of the left panel rail, which overlays the
 * map's left edge. The rail is measured at call time (`#panel-rail`), so the camera offsets by its
 * actual width: left padding = rail width + the edge gap, the other edges just the gap. That centres
 * the focused area/route in the OPEN part of the map instead of behind the panels.
 */
export function frameBounds(map: MapLibreMap, bbox: LngLatBoundsLike): void {
    const railWidth = document.getElementById('panel-rail')?.getBoundingClientRect().width ?? FALLBACK_RAIL_INSET;
    map.fitBounds(bbox, {
        padding: { top: EDGE_PADDING, right: EDGE_PADDING, bottom: EDGE_PADDING, left: railWidth + EDGE_PADDING },
        duration: 600,
    });
}
