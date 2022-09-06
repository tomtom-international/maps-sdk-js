import { Anything, GlobalConfig, HasLngLat } from "@anw/go-sdk-js/core";
import { Projection } from "@nav/web-renderer";
import { BBox } from "geojson";

export const publishedStyleIDs = [
    "standardLight",
    "standardDark",
    "drivingLight",
    "drivingDark",
    "monoLight",
    "satellite"
] as const;

/**
 * ID for a published style.
 */
export type PublishedStyleID = typeof publishedStyleIDs[number];

/**
 * A published style represents a style which is officially hosted by TomTom and easily accessible by its name/ID.
 */
export type PublishedStyle = {
    /**
     * The unique id of the published style.
     */
    id: PublishedStyleID;
    /**
     * An optional version for the map style to load.
     * @default latest SDK-supported version.
     */
    version?: string;
};

export type CustomStyle = {
    /**
     * The URL for the map style.
     * * The API key should be excluded, and otherwise it will be replaced by the map parameters one.
     * * Mutually exclusive with the json direct style input.
     */
    url?: string;
    /**
     * Direct style input as JSON.
     * * This object contains the style as such.
     * * Mutually exclusive with the url style input.
     */
    json?: Anything;
};

/**
 * Style to load on the map.
 * Can be either a:
 * * Published style ID from last supported version.
 * * Published style with extra options.
 * * Custom style.
 */
export type StyleInput =
    | PublishedStyleID
    | {
          /**
           * Published style with optional extra configurations, such as version.
           * * Mutually exclusive with custom style.
           */
          published?: PublishedStyle;
          /**
           * Custom style input, in the form of a given URL, or the style JSON itself.
           * * Mutually exclusive with published style.
           */
          custom?: CustomStyle;
      };

export type MapInitParams = Partial<GlobalConfig> & {
    /**
     * HTML container element where the map is to be attached.
     * * Should exist in the DOM by the same the map is initialized.
     */
    htmlContainer: HTMLElement;
    /**
     * Optional style to load for the map.
     */
    style?: StyleInput;
    /**
     * Where to center the map on startup.
     * * Mutually exclusive with bbox.
     */
    center?: HasLngLat;
    /**
     * Initial zoom on startup.
     * * Mutually exclusive with bbox.
     */
    zoom?: number;
    /**
     * The maximum zoom level of the map.
     */
    maxZoom?: number;
    /**
     * The minimum zoom level of the map
     */
    minZoom?: number;
    /**
     * Initial bounds for the map.
     * * Mutually exclusive with center and zoom.
     */
    bounds?: BBox;
    /**
     * If set, the map will be constrained to the given bounds.
     */
    maxBounds?: BBox;
    /**
     * Initial bearing in degrees.
     */
    bearingDegrees?: number;
    /**
     * The map projection type.
     * @default 'webmercator'
     */
    projection?: Projection;
};
