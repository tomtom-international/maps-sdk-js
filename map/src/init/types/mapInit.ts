import type { GlobalConfig } from "@anw/maps-sdk-js/core";
import type { MapOptions, StyleSpecification } from "maplibre-gl";
import type { MapEventsConfig } from "./mapEventsConfig";

export const publishedStyleIDs = [
    "standardLight",
    "standardDark",
    // TODO: driving styles not supported in Orbis for now
    "drivingLight",
    "drivingDark",
    "monoLight",
    "monoDark",
    "satellite"
] as const;

/**
 * ID for a published style.
 */
export type PublishedStyleID = (typeof publishedStyleIDs)[number];

/**
 * A published style represents a style which is officially hosted by TomTom and easily accessible by its name/ID.
 */
export type PublishedStyle = {
    /**
     * The unique id of the published style.
     */
    id?: PublishedStyleID;
    /**
     * Include traffic incidents, traffic flow, poi and hillshade modules when loading styles.
     */
    include?: StyleModule[];
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
    json?: StyleSpecification;
};

/**
 * Optional parameter to include modules when loading styles.
 * * trafficIncidents: Include traffic incidents
 * * trafficFlow: Include traffic flow
 * * hillshade: Include hillshade
 */
export type StyleModule = "trafficIncidents" | "trafficFlow" | "hillshade";

/**
 * Style to load on the map.
 * Can be either a:
 * * Published style ID from last supported version.
 * * Published style with optional extra configurations, such as module exclusion and style version.
 * * Custom style input, in the form of a given URL, or the style JSON itself.
 */
export type StyleInput =
    | PublishedStyleID
    | (PublishedStyle & { type: "published" })
    | (CustomStyle & { type: "custom" });

export type TomTomMapParams = GlobalConfig & {
    /**
     * Optional style to load for the map.
     */
    style?: StyleInput;

    /**
     * Event configuration
     */
    events?: MapEventsConfig;
};

export type MapLibreOptions = Omit<MapOptions, "style" | "attributionControl">;
