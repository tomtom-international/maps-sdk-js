import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { Map } from 'maplibre-gl';
import type { TomTomMap } from '../../TomTomMap';

/**
 * Options for calculating map center.
 *
 * @group Utils
 */
export type CalculateMapCenterOptions = {
    /** The TomTomMap instance or MapLibre map instance */
    map: TomTomMap | Map;
    /** Array of HTML elements or DOM selector strings that are positioned over the map */
    surroundingElements: (HTMLElement | string)[];
};

/**
 * Options for calculating map bounds.
 *
 * @group Utils
 */
export type CalculateMapBoundsOptions = CalculateMapCenterOptions & {
    /**
     * Additional padding in pixels to apply around the UI elements or map edges. Default is 0.
     */
    paddingPX?: number;
};

/**
 * Options for calculating expanded bounds.
 *
 * @group Utils
 */
export type CalculateFittingBBoxOptions = CalculateMapBoundsOptions & {
    /**
     * The target bounding box [west, south, east, north] that should be contained in the unobscured area
     */
    toBeContainedBBox: BBox;
};
