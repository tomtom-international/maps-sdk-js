import { GlobalConfig } from "@anw/maps-sdk-js/core";
import { MapOptions, StyleSpecification } from "maplibre-gl";
import { MapEventsConfig } from "./MapEventsConfig";

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
     * Exclude traffic incidents, traffic flow, poi and hillshade modules when loading styles.
     */
    exclude?: StyleModules[];
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
 * Optional parameter to exclude modules when loading styles.
 * * trafficIncidents: Exclude traffic incidents
 * * trafficFlow: Exclude traffic flow
 * * pois: Exclude POIs (Points of Interest)
 * * hillshade: Exclude hillshade
 */
export type StyleModules = "traffic_incidents" | "traffic_flow" | "poi" | "hillshade";

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
