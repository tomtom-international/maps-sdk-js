import type { Anything, CommonPlaceProps } from '@anw/maps-sdk-js/core';
import type { SupportsEvents } from '../../shared';

/**
 * Properties to display a place on the map.
 */
export type LocationDisplayProps = {
    /**
     * Typically SDK features have IDs at the GeoJSON Feature root level, as per specification.
     * However, MapLibre does not reuse the given feature ID. Either we generate it on the fly or use the one from properties via promotedId value.
     * We must generate "id" property based on the feature id on the fly on "prepareForDisplay" functions.
     */
    id: string | number;
    /**
     * Display title for the place on the map.
     */
    title?: string;
    /**
     * Icon ID referencing the map style sprite.
     */
    iconID: string;
    /**
     * Map-style-compatible display category, mostly applicable for poi-like places.
     */
    category?: string;
} & SupportsEvents &
    Anything;

/**
 * Place base and display properties.
 */
export type DisplayPlaceProps = CommonPlaceProps & LocationDisplayProps;

/**
 * @ignore
 */
export const TITLE = 'title';

/**
 * @ignore
 */
export const ICON_ID = 'iconID';
