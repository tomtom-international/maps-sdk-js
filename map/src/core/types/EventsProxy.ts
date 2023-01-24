import { LngLat, MapGeoJSONFeature } from "maplibre-gl";
import { SourceWithLayers } from "./GOSDKLayerSpecs";

export type ClickEvent = "click" | "contextmenu";
export type HoverEvent = "hover" | "long-hover";
export type EventType = ClickEvent | HoverEvent;

/**
 * Hover/Click event. Happens when the user clicks on a feature belonging to any of the registered sources/layers.
 * @param lngLat The click coordinates. Will likely be nearby the feature but might not literally be on it (taking padding into account).
 * @param features Features (Layers) interative when the event occurred.
 * @param sourceWithLayers The source with layers to which the feature belongs to.
 */
export type HoverClickHandler = (
    lngLat: LngLat,
    features: MapGeoJSONFeature[],
    sourceWithLayers?: SourceWithLayers
) => void;

export type EventHandlers = Record<string, Array<HoverClickHandler>>;
