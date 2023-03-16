import { Anything, CommonPlaceProps } from "@anw/go-sdk-js/core";
import { SupportsEvents } from "../../shared";

/**
 * Properties to display a place on the map.
 */
export type LocationDisplayProps = {
    title?: string;
    iconID: string;
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
