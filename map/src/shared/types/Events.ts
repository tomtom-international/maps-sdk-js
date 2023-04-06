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
 * @param topFeature For GeoJSON modules "topFeature" will be mapped to the original feature being sent to the render and
 * for vector tile modules it will be mapped to a type derived from the map geojson feature itself.
 * @param lngLat The event target coordinates. Will likely be nearby the feature but might not literally be on it (taking padding into account).
 * @param allEventFeatures  Features from MapLibre (MapGeoJSONFeatures)
 * which includes all the interactive features related to the event, possibly across different map modules.
 * @param sourceWithLayers The source with layers to which the feature belongs to.
 */
export type UserEventHandler<T> = (
    topFeature: T,
    lngLat: LngLat,
    allEventFeatures: MapGeoJSONFeature[],
    sourceWithLayers: SourceWithLayers
) => void;
