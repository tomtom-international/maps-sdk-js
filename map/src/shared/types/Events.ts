import { LngLat, MapGeoJSONFeature } from "maplibre-gl";
import { SourceWithLayers } from "./MapsSDKLayerSpecs";

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
