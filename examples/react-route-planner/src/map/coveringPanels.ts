import type { BBox } from '@tomtom-org/maps-sdk/core';
import { calculatePaddedBBox, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { FlyoverAnchor } from '@tomtom-org/maps-sdk-plugin-flyover';
import type { FlyToOptions, PaddingOptions } from 'maplibre-gl';
import { reclaimCamera } from './cameraHolder';

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

    // The box's south-west and north-east corners are the uncovered area's bottom-left and top-right
    // pixels: projected back, they land on those pixels on a tilted map too.
    const [west, south, east, north] = visible;
    const { mapLibreMap } = map;
    const bottomLeft = mapLibreMap.project([west, south]);
    const topRight = mapLibreMap.project([east, north]);
    const { clientWidth, clientHeight } = mapLibreMap.getContainer();
    return {
        left: bottomLeft.x,
        top: topRight.y,
        right: clientWidth - topRight.x,
        bottom: clientHeight - bottomLeft.y,
    };
};

/** A spot given as shares of the whole map, moved to the same shares of the part the panels leave uncovered. */
export const anchorBetweenPanels = (map: TomTomMap, { x, y }: FlyoverAnchor): FlyoverAnchor => {
    const padding = panelPadding(map);
    if (!padding) return { x, y };

    const { left = 0, top = 0, right = 0, bottom = 0 } = padding;
    const { clientWidth, clientHeight } = map.mapLibreMap.getContainer();
    return {
        x: (left + (clientWidth - left - right) * x) / clientWidth,
        y: (top + (clientHeight - top - bottom) * y) / clientHeight,
    };
};

// The planner looks straight down, north up: only a fly-over tilts and turns the camera. MapLibre
// also fits a box as if the map were flat, so a tilted fit would leave it small.
const TOP_VIEW = { pitch: 0, bearing: 0 };

/** Eases the camera back to the top view in place, after any move under way ends. */
export const easeToTopView = ({ mapLibreMap }: TomTomMap) => {
    const ease = () => mapLibreMap.easeTo({ ...TOP_VIEW, duration: MOVE_MS });
    if (mapLibreMap.isMoving()) mapLibreMap.once('moveend', ease);
    else ease();
};

/**
 * Flies to the box, centred in the map the panels leave uncovered, in the top view. The padding
 * frames the camera only: given to `flyTo`, it would stay on the map for every move after.
 */
const flyToBetweenPanels = (
    map: TomTomMap,
    bbox: BBox,
    maxZoom: number,
    timing: Pick<FlyToOptions, 'duration'> = {},
) => {
    reclaimCamera();
    const camera = map.mapLibreMap.cameraForBounds(bbox, { padding: panelPadding(map), maxZoom, ...TOP_VIEW });
    // A `duration: undefined` would override MapLibre's own, and break the ease it falls back on
    // when the camera is already there.
    if (camera) map.mapLibreMap.flyTo({ ...camera, ...TOP_VIEW, ...timing });
};

/** Fits the box, centred, into the map the panels leave uncovered. */
export const fitBetweenPanels = (map: TomTomMap, bbox: BBox, maxZoom = map.mapLibreMap.getMaxZoom()) =>
    flyToBetweenPanels(map, bbox, maxZoom, { duration: MOVE_MS });

/** Flies to the position, centred in the map the panels leave uncovered. */
export const flyBetweenPanels = (map: TomTomMap, [longitude, latitude]: number[], zoom: number) =>
    flyToBetweenPanels(map, [longitude, latitude, longitude, latitude], zoom);
