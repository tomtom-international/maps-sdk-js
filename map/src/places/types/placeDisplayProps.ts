import { Anything, CommonPlaceProps } from "@anw/maps-sdk-js/core";
import { SupportsEvents } from "../../shared";

/**
 * Properties to display a place on the map.
 */
export type LocationDisplayProps = {
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
export const TITLE = "title";

/**
 * @ignore
 */
export const ICON_ID = "iconID";
