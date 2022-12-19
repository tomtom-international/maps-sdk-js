import { LngLat, MapGeoJSONFeature } from "maplibre-gl";
import { StyleSourceWithLayers } from "../SourceWithLayers";

export type ClickEvent = "click" | "contextmenu";
export type HoverEvent = "hover" | "long-hover";
export type EventType = ClickEvent | HoverEvent;

/**
 * Click event. Happens when the user clicks on a feature belonging to any of the registered sources/layers.
 * @param lngLat The click coordinates. Will likely be nearby the feature but might not literally be on it (taking padding into account).
 * @param feature The clicked z-top-most feature, first one as queried from the map.
 * @param sourceWithLayers The source with layers to which the feature belongs to.
 */
export type HoverClickHandler = (
    lngLat?: LngLat,
    feature?: MapGeoJSONFeature,
    sourceWithLayers?: StyleSourceWithLayers
) => void;

export type EventListeners = { [_: string]: Array<HoverClickHandler> };
