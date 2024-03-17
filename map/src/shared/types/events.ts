import type { LngLat, MapGeoJSONFeature } from "maplibre-gl";
import type { SourceWithLayers } from "./mapsSDKLayerSpecs";

/**
 * Subtype for click events.
 * * click: regular click or tap
 * * contextmenu: right-click
 */
export type ClickEventType = "click" | "contextmenu";

/**
 * Subtype for hover events.
 * * hover: immediate hover
 * * long-hover: hovering over an item for long enough (depending on config, usually more than half a second)
 */
export type HoverEventType = "hover" | "long-hover";

/**
 * Type of user event supported by the SDK beyond basic MapLibre support.
 */
export type EventType = ClickEventType | HoverEventType;

/**
 * Parameters to update the event state of a feature programmatically.
 */
export type PutEventStateOptions = {
    /**
     * The index of the feature in the feature array.
     */
    index: number;

    /**
     * The event state to set.
     */
    state: EventType;

    /**
     * Whether to:
     * * put: set the event state in this feature and remove it from any feature having the same. Default mode.
     * * add: set the event state in this feature regardless of what other features already have.
     * @default put
     */
    mode?: "put" | "add";

    /**
     * Whether to show the feature after updating the event state.
     * * Defaults to true. Set to false only if you want to keep manipulating the features before showing them.
     * @default true
     */
    show?: boolean;
};

export type CleanEventStateOptions = {
    /**
     * The index of the feature in the feature array.
     */
    index: number;

    /**
     * Whether to show the feature after cleaning the event state.
     * * Defaults to true. Set to false only if you want to keep manipulating the features before showing them.
     * @default true
     */
    show?: boolean;
};

/**
 * Parameters to clean event states for a collection of shown features.
 */
export type CleanEventStatesOptions = {
    /**
     * The event states to clean.
     * * If none are supplied, then any event states will be cleaned.
     */
    states?: EventType[];

    /**
     * Whether to show the feature after cleaning the event state.
     * * Defaults to true. Set to false only if you want to keep manipulating the features before showing them.
     * @default true
     */
    show?: boolean;
};

/**
 * Properties part for an object that can have event state.
 */
export type SupportsEvents = {
    eventState?: EventType;
};

/**
 * Handler for a user event (such as click or hover).
 * @param topFeature The top target feature for the event, which matches the event coordinates and is also on top of any other matching features.
 * For GeoJSON (added data) modules topFeature is mapped to the original feature being sent to "show" method.
 * For vector tile (based on map style) modules, it will be mapped to a type derived from the map feature itself (based on `MapGeoJSONFeature`).
 * @param lngLat The event target coordinates. Will be nearby `topFeature` but might not literally be on it (taking padding into account).
 * @param allEventFeatures All the features which match with the event coordinates, possibly across different map modules, as MapLibre GeoJSON "raw" feature objects.
 * The first one is the MapGeoJSONFeature equivalent of `topFeature`.
 * @param sourceWithLayers The source with layers to which `topFeature` belongs to.
 */
export type UserEventHandler<T> = (
    topFeature: T,
    lngLat: LngLat,
    allEventFeatures: MapGeoJSONFeature[],
    sourceWithLayers: SourceWithLayers
) => void;
