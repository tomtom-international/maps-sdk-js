import { LngLat, MapGeoJSONFeature } from "maplibre-gl";
import { SourceWithLayers } from "./GOSDKLayerSpecs";

export type ClickEventType = "click" | "contextmenu";
export type HoverEventType = "hover" | "long-hover";
export type EventType = ClickEventType | HoverEventType;

/**
 * Hover/Click event. Happens when the user clicks on a feature belonging to any of the registered sources/layers.
 * @param lngLat The click coordinates. Will likely be nearby the feature but might not literally be on it (taking padding into account).
 * @param topFeature For GeoJSON modules "topFeature" will be mapped to the original feature being sent to the render and
 * for vector tile modules it will be mapped to a type derived from the map geojson feature itself.
 * @param features  Features from MapLibre (MapGeoJSONFeatures), this include all features.
 * @param sourceWithLayers The source with layers to which the feature belongs to.
 */
export type HoverClickHandler<T> = (
    lngLat: LngLat,
    topFeature: T,
    features?: MapGeoJSONFeature[],
    sourceWithLayers?: SourceWithLayers
) => void;

export type EventHandlers = Record<string, Array<HoverClickHandler<MapGeoJSONFeature>>>;
