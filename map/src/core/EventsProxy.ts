import { Map, Point2D, MapGeoJSONFeature, LngLat, MapMouseEvent } from "maplibre-gl";
import { POI_SOURCE_ID } from "./layers/sourcesIDs";
import { AbstractEventProxy } from "./AbstractEventProxy";
import { ClickEvent } from "./types/EventsProxy";
import { SourceWithLayers } from "./types/GOSDKLayerSpecs";
import { MapEventsConfig } from "../init/types/MapEventsConfig";

// Default values for events
const eventsProxyDefaultConfig: Required<MapEventsConfig> = {
    paddingBox: 5,
    paddingBoxUpdateOnZoom: true,
    cursorOnHover: "pointer",
    cursorOnMouseDown: "grabbing",
    cursorOnMap: "default",
    /** Delayed hover control:
     *  The first hover we do after the map moves is longer
     */
    hoverDelayOnMapMove: 800,
    /* Followup hovers with the same non-moving map are quicker ("hovering around mode") */
    hoverDelayOnMapStop: 300
};

/**
 * This is the place where we handle the user events on the map (mousemove/hover and click mostly).
 * To have full control on hovers and clicks when multiple overlapping layers are present, that logic must be centralized here.
 */
export class EventsProxy extends AbstractEventProxy {
    private map: Map;
    private enabled = true;
    private hoveringLngLat?: LngLat;
    private hoveringPoint?: Point2D;
    private hoveringFeature?: MapGeoJSONFeature;
    private hoveredFeatures?: MapGeoJSONFeature[];
    private hoveringSourceWithLayers?: SourceWithLayers;
    private longHoverTimeoutHandlerID?: number;
    // Control flag to indicate that the coming hover is the first one since the map is "quiet" again:
    private firstDelayedHoverSinceMapMove = true;
    private lastClickedFeature?: MapGeoJSONFeature;
    private lastClickedSourceWithLayers?: SourceWithLayers;
    private lastCursorStyle: string;
    // Configuration
    private config: Required<MapEventsConfig>;
    private paddingBoxOnZoom: number | null = null;
    private defaultZoomLevel: number;

    constructor(map: Map, config: MapEventsConfig = {}) {
        super();
        this.map = map;
        this.config = { ...eventsProxyDefaultConfig, ...config };
        this.map.getCanvas().style.cursor = this.config.cursorOnMap;
        this.lastCursorStyle = this.config.cursorOnMap;
        this.defaultZoomLevel = Math.round(this.map.getZoom());
        this.listenToDefaultEvents();
        this.listenToMapClicks();
        console.log(config.cursorOnHover);
    }

    private listenToDefaultEvents = () => {
        this.map.on("mousemove", this.onMouseMove);
        this.map.on("movestart", this.onMouseStart);
        this.map.on("mouseout", this.onMouseOut);
        this.map.on("mouseover", this.onMouseMove);
        this.map.on("mousedown", this.onMouseDown);
        this.map.on("mouseup", this.onMouseUp);
        this.map.on("zoom", this.onZoom);
    };

    private listenToMapClicks = () => {
        this.map.on("click", this.onMapClick("click"));
        this.map.on("contextmenu", this.onMapClick("contextmenu"));
    };

    // Enable/Disable Events
    public enable = (enabled: boolean) => {
        this.enabled = enabled;
        if (!enabled) {
            window.clearTimeout(this.longHoverTimeoutHandlerID);
        }
    };

    private toPaddedBounds(point: Point2D): [[number, number], [number, number]] {
        const paddingBox = this.paddingBoxOnZoom || this.config.paddingBox;

        return [
            // sw:
            [point.x - paddingBox, point.y + paddingBox],
            // ne:
            [point.x + paddingBox, point.y - paddingBox]
        ];
    }

    private onZoom = () => {
        if (!this.config.paddingBoxUpdateOnZoom) {
            return;
        }
        const paddedBoundsOnZoom = Math.round(this.config.paddingBox * Math.round(this.map.getZoom())) / 10;

        // Keep the given paddingBox during the same default zoom level
        if (Math.round(this.map.getZoom()) === this.defaultZoomLevel) {
            this.paddingBoxOnZoom = this.config.paddingBox;
        } else if (this.map.getZoom() > this.defaultZoomLevel) {
            this.paddingBoxOnZoom = Math.ceil(this.config.paddingBox + paddedBoundsOnZoom) - this.config.paddingBox;
        } else {
            this.paddingBoxOnZoom = this.config.paddingBox - Math.floor(this.config.paddingBox - paddedBoundsOnZoom);
        }
    };

    private onMouseStart = () => {
        this.firstDelayedHoverSinceMapMove = true;
        window.clearTimeout(this.longHoverTimeoutHandlerID);
    };

    private onMouseOut = () => {
        // Preventing accidental de-hover event if we actually leave the map canvas.
        // Since this could potentially be about jumping into a map popup, so we leave that up to the caller.
        window.clearTimeout(this.longHoverTimeoutHandlerID);
    };

    private onMouseDown = () => {
        this.lastCursorStyle = this.map.getCanvas().style.cursor;
        this.map.getCanvas().style.cursor = this.config.cursorOnMouseDown;
    };

    private onMouseUp = () => {
        this.map.getCanvas().style.cursor = this.lastCursorStyle;
    };

    private onMouseMove = (ev: MapMouseEvent) => {
        if (!this.enabled || this.map.isMoving()) {
            // We ensure no unwanted hover handling while the map moves
            return;
        }

        this.hoveredFeatures = this.map.queryRenderedFeatures(this.toPaddedBounds(ev.point), {
            layers: this.interactiveLayerIDs
        });

        const hoveredTopFeature = this.hoveredFeatures[0];
        const listenerId = hoveredTopFeature && hoveredTopFeature.source + `_hover`;

        // flag to determine whether a change happened, such as no-hover -> hover or vice-versa:
        let hoverChangeDetected = false;
        // flag to detect whether the mouse is moving along the hovered feature (not stopped on it):
        let mouseInMotionOverHoveredFeature = false;

        if (hoveredTopFeature) {
            // Workaround/hack to avoid listening to map style POIs without ID (bad data):
            if (hoveredTopFeature.source === POI_SOURCE_ID && !hoveredTopFeature.properties?.id) {
                return;
            }

            if (!this.hoveringFeature) {
                // no hover -> hover
                this.map.getCanvas().style.cursor = this.config.cursorOnHover;
                hoverChangeDetected = true;
            } else if (hoveredTopFeature.id !== this.hoveringFeature.id) {
                // hovering from one feature to another one (from the same or different layer/source):
                hoverChangeDetected = true;
            } else {
                // (else we're hovering along the same feature)
                if (this.hoveringPoint) {
                    if (
                        Math.abs(ev.point.x - this.hoveringPoint?.x) > 0 ||
                        Math.abs(ev.point.y - this.hoveringPoint?.y) > 0
                    ) {
                        mouseInMotionOverHoveredFeature = true;
                    }
                }
            }
        } else {
            if (this.hoveringFeature) {
                // hover -> no hover (un-hover)
                this.map.getCanvas().style.cursor = this.config.cursorOnMap;
                hoverChangeDetected = true;
            }
        }

        this.hoveringLngLat = ev.lngLat;
        this.hoveringPoint = ev.point;
        this.hoveringFeature = hoveredTopFeature;
        this.hoveringSourceWithLayers = hoveredTopFeature
            ? this.interactiveSourcesAndLayers[hoveredTopFeature.source]
            : undefined;

        if (hoverChangeDetected) {
            if (this.handlers[listenerId]) {
                // (If de-hovering this should fire undefined, undefined):
                this.handlers[listenerId].forEach((cb) =>
                    cb(ev.lngLat, this.hoveredFeatures, this.hoveringSourceWithLayers)
                );
            }
        }

        if (hoverChangeDetected || mouseInMotionOverHoveredFeature) {
            this.restartLongHoverTimeout();
        }
    };

    private restartLongHoverTimeout = () => {
        window.clearTimeout(this.longHoverTimeoutHandlerID);
        this.longHoverTimeoutHandlerID = window.setTimeout(
            this.handleLongHoverTimeout,
            this.firstDelayedHoverSinceMapMove ? this.config.hoverDelayOnMapMove : this.config.hoverDelayOnMapStop
        );
    };

    private handleLongHoverTimeout = () => {
        // We try to avoid firing long hovers when the feature was just clicked
        // (requires a safe-ish efficient way to compare features coming from different events, like IDs):
        if (
            !this.hoveringFeature ||
            !this.lastClickedFeature ||
            // properties IDs, if any, are expected to be most reliable for comparison:
            this.lastClickedFeature.properties.id !== this.hoveringFeature.properties.id ||
            (!this.lastClickedFeature.properties.id &&
                !this.hoveringFeature.properties.id &&
                // otherwise (auto-generated) IDs are used next, but they could potentially be different for essentially the same core item:
                this.lastClickedFeature.id !== this.hoveringFeature.id)
        ) {
            this.firstDelayedHoverSinceMapMove = false;
            if (this.hoveringSourceWithLayers) {
                const listenerId = this.hoveringSourceWithLayers.source.id + "_long-hover";
                if (this.handlers[listenerId]) {
                    this.handlers[listenerId].forEach((cb) =>
                        cb(this.hoveringLngLat, this.hoveredFeatures, this.hoveringSourceWithLayers)
                    );
                }
            }
        }
    };

    private onMapClick = (clickType: ClickEvent) => (ev: MapMouseEvent) => {
        if (!this.enabled || this.map.isMoving()) {
            // We avoid any accidental click handling while the map moves
            return;
        }

        const clickedFeatures = this.map.queryRenderedFeatures(this.toPaddedBounds(ev.point), {
            layers: this.interactiveLayerIDs
        });

        this.lastClickedFeature = clickedFeatures[0];

        this.lastClickedSourceWithLayers = this.lastClickedFeature
            ? this.interactiveSourcesAndLayers[this.lastClickedFeature.source]
            : undefined;

        if (
            this.lastClickedSourceWithLayers &&
            this.handlers[this.lastClickedSourceWithLayers.source.id + `_${clickType}`]
        ) {
            this.handlers[this.lastClickedSourceWithLayers.source.id + `_${clickType}`].forEach((cb) => {
                cb(ev.lngLat, clickedFeatures, this.lastClickedSourceWithLayers);
            });
        }
    };
}
