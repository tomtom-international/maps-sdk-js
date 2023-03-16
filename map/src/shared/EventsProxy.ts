import { LngLat, Map, MapGeoJSONFeature, MapMouseEvent, Point2D, PointLike } from "maplibre-gl";
import { AbstractEventProxy } from "./AbstractEventProxy";
import { ClickEventType, SourceWithLayers } from "./types";
import { MapEventsConfig } from "../init";
import { areBothDefinedAndEqual, deserializeFeatures } from "./mapUtils";
import { detectHoverState, updateEventState } from "./eventUtils";

// Default values for events
const eventsProxyDefaultConfig: Required<MapEventsConfig> = {
    paddingBox: 5,
    paddingBoxUpdateOnZoom: true,
    cursorOnHover: "pointer",
    cursorOnMouseDown: "grabbing",
    cursorOnMap: "default",
    /**
     * Delayed hover control:
     * * The first hover we do after the map moves is longer
     */
    hoverDelayMsAfterMapMove: 800,
    /* Followup hovers with the same non-moving map are quicker ("hovering around mode") */
    hoverDelayMsOnStillMap: 300
};

/**
 * This is the place where we handle the user events on the map (mousemove/hover and click mostly).
 * To have full control on hovers and clicks when multiple overlapping layers are present, that logic must be centralized here.
 * @ignore
 */
export class EventsProxy extends AbstractEventProxy {
    private readonly map: Map;
    private readonly mapCanvas: HTMLCanvasElement;
    private enabled = true;
    private hoveringLngLat?: LngLat;
    private hoveringPoint?: Point2D;
    private hoveringFeature?: MapGeoJSONFeature;
    private hoveringFeatures?: MapGeoJSONFeature[];
    private hoveringSourceWithLayers?: SourceWithLayers;
    private longHoverTimeoutHandlerID?: number;
    // Control flag to indicate that the coming hover is the first one since the map is "quiet" again:
    private firstDelayedHoverSinceMapMove = true;
    private lastClickedFeature?: MapGeoJSONFeature;
    private lastClickedSourceWithLayers?: SourceWithLayers;
    private lastCursorStyle: string;
    // Configuration
    private readonly config: Required<MapEventsConfig>;
    private paddingBoxOnZoom: number | null = null;
    private readonly defaultZoomLevel: number;

    constructor(map: Map, config: MapEventsConfig = {}) {
        super();
        this.map = map;
        this.mapCanvas = map.getCanvas();
        this.config = { ...eventsProxyDefaultConfig, ...config };
        this.mapCanvas.style.cursor = this.config.cursorOnMap;
        this.lastCursorStyle = this.config.cursorOnMap;
        this.defaultZoomLevel = Math.round(this.map.getZoom());
        this.listenToEvents();
    }

    private listenToEvents() {
        this.map.on("mousemove", (ev) => this.onMouseMove(ev));
        this.map.on("movestart", () => this.onMouseStart());
        this.map.on("mouseout", () => this.onMouseOut());
        this.map.on("mouseover", (ev) => this.onMouseMove(ev));
        this.map.on("mousedown", () => this.onMouseDown());
        this.map.on("mouseup", () => this.onMouseUp());
        this.map.on("zoom", () => this.onZoom());
        this.map.on("click", (ev) => this.onMapClick("click", ev));
        this.map.on("contextmenu", (ev) => this.onMapClick("contextmenu", ev));
    }

    // Enable/Disable Events
    public enable(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearLongHoverTimeout();
        }
    }

    private toPaddedBounds(point: Point2D): [[number, number], [number, number]] {
        const paddingBox = this.paddingBoxOnZoom || this.config.paddingBox;
        return [
            // sw:
            [point.x - paddingBox, point.y + paddingBox],
            // ne:
            [point.x + paddingBox, point.y - paddingBox]
        ];
    }

    private isEnabled() {
        return this.enabled && !this.map.isMoving();
    }

    private getRenderedFeatures(point: Point2D): MapGeoJSONFeature[] {
        const options = { layers: this.interactiveLayerIDs };
        const renderedFeatures = this.map.queryRenderedFeatures(point as PointLike, options);
        return renderedFeatures.length
            ? renderedFeatures
            : this.map.queryRenderedFeatures(this.toPaddedBounds(point), options);
    }

    private clearLongHoverTimeout() {
        window.clearTimeout(this.longHoverTimeoutHandlerID);
    }

    private restartLongHoverTimeout() {
        this.clearLongHoverTimeout();
        this.longHoverTimeoutHandlerID = window.setTimeout(
            () => this.handleLongHoverTimeout(),
            this.firstDelayedHoverSinceMapMove
                ? this.config.hoverDelayMsAfterMapMove
                : this.config.hoverDelayMsOnStillMap
        );
    }

    private handleLongHoverTimeout() {
        // We avoid firing long hovers when the feature is in clicked state:
        if (!areBothDefinedAndEqual(this.hoveringFeature, this.lastClickedFeature)) {
            this.firstDelayedHoverSinceMapMove = false;

            if (this.hoveringSourceWithLayers) {
                const eventState = updateEventState(
                    "long-hover",
                    this.hoveringFeature,
                    undefined,
                    this.hoveringSourceWithLayers,
                    undefined
                );

                const listenerId = this.hoveringSourceWithLayers.source.id + "_long-hover";
                this.handlers[listenerId]?.forEach((handler) =>
                    handler(
                        this.hoveringLngLat as LngLat,
                        eventState?.feature,
                        this.hoveringFeatures,
                        this.hoveringSourceWithLayers
                    )
                );
            }
        }
    }

    /**
     * Private event handlers for Maplibre events.
     */
    private onZoom() {
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
    }

    private onMouseStart() {
        this.firstDelayedHoverSinceMapMove = true;
        this.clearLongHoverTimeout();
    }

    private onMouseOut() {
        // Preventing accidental de-hover event if we actually leave the map canvas.
        // Since this could potentially be about jumping into a map popup, so we leave that up to the caller.
        this.clearLongHoverTimeout();
    }

    private onMouseDown() {
        this.lastCursorStyle = this.mapCanvas.style.cursor;
        this.mapCanvas.style.cursor = this.config.cursorOnMouseDown;
    }

    private onMouseUp() {
        this.mapCanvas.style.cursor = this.lastCursorStyle;
    }

    private onMouseMove(ev: MapMouseEvent) {
        if (!this.isEnabled()) {
            // We ensure no unwanted hover handling while disabled or the map moves
            return;
        }

        this.hoveringFeatures = this.getRenderedFeatures(ev.point);
        deserializeFeatures(this.hoveringFeatures);
        const [hoveredTopFeature] = this.hoveringFeatures;

        // Check if the layer has any handlers registered:
        if (hoveredTopFeature && !this.hasAnyHandlerRegistered(hoveredTopFeature.source)) {
            return;
        }

        // hoverChangeDetected: whether a change happened, such as no-hover -> hover or vice-versa:
        // mouseInMotionOverHoveredFeature: whether the mouse is moving along the hovered feature (not stopped on it):
        const { hoverChanged, mouseInMotionOverHoveredFeature } = detectHoverState(
            ev.point,
            this.hoveringPoint,
            hoveredTopFeature,
            this.hoveringFeature
        );

        if (hoverChanged || mouseInMotionOverHoveredFeature) {
            this.hoveringLngLat = ev.lngLat;
            this.hoveringPoint = ev.point;
            const prevHoveredFeature = this.hoveringFeature;
            this.hoveringFeature = hoveredTopFeature;
            const prevHoveredSourceWithLayers = this.hoveringSourceWithLayers;
            this.hoveringSourceWithLayers = this.interactiveSourcesAndLayers[hoveredTopFeature?.source];

            if (hoverChanged) {
                this.updateCursor(prevHoveredFeature);

                const eventState = updateEventState(
                    "hover",
                    this.hoveringFeature,
                    prevHoveredFeature,
                    this.hoveringSourceWithLayers,
                    prevHoveredSourceWithLayers
                );

                const listenerId = hoveredTopFeature && hoveredTopFeature.source + `_hover`;
                if (this.handlers[listenerId]) {
                    if (eventState && this.handlers[listenerId]) {
                        for (const handler of this.handlers[listenerId]) {
                            handler(
                                ev.lngLat,
                                eventState.feature,
                                this.hoveringFeatures,
                                this.hoveringSourceWithLayers
                            );
                        }
                    }
                }
            }

            this.restartLongHoverTimeout();
        }
    }

    private updateCursor(prevHoveredFeature: MapGeoJSONFeature | undefined) {
        if (!prevHoveredFeature && this.hoveringFeature) {
            // no hover -> hover
            this.mapCanvas.style.cursor = this.config.cursorOnHover;
        } else if (prevHoveredFeature && !this.hoveringFeature) {
            // hover -> no hover (un-hover)
            this.mapCanvas.style.cursor = this.config.cursorOnMap;
        }
    }

    private onMapClick(clickType: ClickEventType, ev: MapMouseEvent) {
        if (!this.isEnabled()) {
            // We avoid any accidental click handling while disabled or the map moves
            return;
        }

        const clickedFeatures = this.getRenderedFeatures(ev.point);
        // Deserialize Features from maplibre queryRenderedFeatures response
        deserializeFeatures(clickedFeatures);

        const prevClickedFeature = this.lastClickedFeature;
        this.lastClickedFeature = clickedFeatures[0];
        const prevClickedSourceWithLayers = this.lastClickedSourceWithLayers;
        this.lastClickedSourceWithLayers = this.interactiveSourcesAndLayers[this.lastClickedFeature?.source];
        const handlers = this.handlers[this.lastClickedFeature?.source + `_${clickType}`];

        if (handlers || !this.lastClickedFeature) {
            const eventState = updateEventState(
                clickType,
                this.lastClickedFeature,
                prevClickedFeature,
                this.lastClickedSourceWithLayers,
                prevClickedSourceWithLayers
            );

            if (handlers && eventState) {
                for (const handler of handlers) {
                    handler(ev.lngLat, eventState.feature, clickedFeatures, this.lastClickedSourceWithLayers);
                }
            }
        }
    }
}
