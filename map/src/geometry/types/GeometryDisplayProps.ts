import { Anything, CommonPlaceProps } from "@anw/maps-sdk-js/core";
import { SupportsEvents } from "../../shared";

/**
 * Extra properties to display color and title for a geometry on the map.
 */
export type ExtraGeometryDisplayProps = {
    title?: string;
    color?: string;
} & SupportsEvents &
    Anything;

/**
 * Geometry base and display properties.
 */
export type DisplayGeometryProps = CommonPlaceProps & ExtraGeometryDisplayProps;

/**
 * @ignore
 */
export const TITLE = "title";

/**
 * @ignore
 */
export const COLOR = "color";
