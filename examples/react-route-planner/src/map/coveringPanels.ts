import type { BBox } from '@tomtom-org/maps-sdk/core';
import { calculatePaddedBBox, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { PaddingOptions } from 'maplibre-gl';

/**
 * The panels over the map, for the camera to frame its target between. The sections bar counts by
 * its dock, which spans the map's width: the bar alone, closer to the right edge than to the
 * bottom, would read as a panel on the right.
 */
const coveringPanels = ['.ui-planner', '.ui-sections-dock'];

const MARGIN_PX = 48;
const MOVE_MS = 800;

/** The map's edges the panels cover, plus a margin, as MapLibre camera padding. */
const panelPadding = (map: TomTomMap): PaddingOptions | undefined => {
    const visible = calculatePaddedBBox({ map, surroundingElements: coveringPanels, paddingPX: MARGIN_PX });
    if (!visible) return undefined;

    const [west, south, east, north] = visible;
    const { mapLibreMap } = map;
    const topLeft = mapLibreMap.project([west, north]);
    const bottomRight = mapLibreMap.project([east, south]);
    const { clientWidth, clientHeight } = mapLibreMap.getContainer();
    return {
        left: topLeft.x,
        top: topLeft.y,
        right: clientWidth - bottomRight.x,
        bottom: clientHeight - bottomRight.y,
    };
};

/** Fits the box, centred, into the map the panels leave uncovered. */
export const fitBetweenPanels = (map: TomTomMap, bbox: BBox, maxZoom = map.mapLibreMap.getMaxZoom()) =>
    map.mapLibreMap.fitBounds(bbox, { padding: panelPadding(map), maxZoom, duration: MOVE_MS });

/**
 * Flies to the position, centred in the map the panels leave uncovered. The padding frames the
 * camera only: given to `flyTo`, it would stay on the map for every move after.
 */
export const flyBetweenPanels = (map: TomTomMap, [longitude, latitude]: number[], zoom: number) => {
    const camera = map.mapLibreMap.cameraForBounds([longitude, latitude, longitude, latitude], {
        padding: panelPadding(map),
        maxZoom: zoom,
    });
    if (camera) map.mapLibreMap.flyTo(camera);
};
