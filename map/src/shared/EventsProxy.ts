import type { Feature } from 'geojson';
import type { LngLat, Map, MapGeoJSONFeature, MapMouseEvent, Point2D, PointLike } from 'maplibre-gl';
import type { MapEventsConfig } from '../init';
import { AbstractEventProxy, type HandlerEntry } from './AbstractEventProxy';
import { dedupeRenderedFeatures, detectHoverState, scopeToSource, updateEventState } from './eventUtils';
import { renderedRefId } from './featureId';
import { GeoJSONSourceWithLayers } from './SourceWithLayers';
import type { ClickEventType, EventHandlerConfig, SourceWithLayers } from './types';

// Shared empty result, so the fallbacks on the pointer path never allocate.
const noRenderedFeatures: MapGeoJSONFeature[] = [];

// Default values for events
const eventsProxyDefaultConfig: Required<MapEventsConfig> = {
    precisionMode: 'box',
    paddingBoxPx: 5,
    cursorOnHover: 'pointer',
    cursorOnMouseDown: 'grabbing',
    cursorOnMap: 'default',
    /**
     * Delayed hover control:
     * * The first hover we do after the map moves is longer
     */
    longHoverDelayAfterMapMoveMS: 800,
    /* Followup hovers with the same non-moving map are quicker ("hovering around mode") */
    longHoverDelayOnStillMapMS: 300,
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
    // Newest un-handled mouse move, and whether a frame is already booked to handle it.
    private pendingMouseMove?: MapMouseEvent;
    private mouseMoveFrameRequested = false;
    // Configuration
    private readonly config: Required<MapEventsConfig>;

    constructor(map: Map, config: MapEventsConfig = {}) {
        super();
        this.map = map;
        this.mapCanvas = map.getCanvas();
        this.config = { ...eventsProxyDefaultConfig, ...config };
        this.mapCanvas.style.cursor = this.config.cursorOnMap;
        this.lastCursorStyle = this.config.cursorOnMap;
        this.listenToEvents();
    }

    private listenToEvents() {
        this.map.on('mousemove', (ev) => this.onMouseMove(ev));
        this.map.on('movestart', () => this.onMouseStart());
        this.map.on('mouseout', () => this.onMouseOut());
        this.map.on('mouseover', (ev) => this.onMouseMove(ev));
        this.map.on('mousedown', () => this.onMouseDown());
        this.map.on('mouseup', () => this.onMouseUp());
        this.map.on('click', (ev) => this.onMapClick('click', ev));
        this.map.on('contextmenu', (ev) => this.onMapClick('contextmenu', ev));
    }

    // Enable/Disable Events
    public enable(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearLongHoverTimeout();
            // Drop any move already queued for the next frame, so disabling takes effect now
            // rather than one frame late.
            this.pendingMouseMove = undefined;
        }
    }

    private toPaddedBounds(point: Point2D): [[number, number], [number, number]] {
        const padding = this.config.paddingBoxPx;
        return [
            // sw:
            [point.x - padding, point.y + padding],
            // ne:
            [point.x + padding, point.y - padding],
        ];
    }

    private isEnabled() {
        return this.enabled && !this.map.isMoving();
    }

    /**
     * Build the consumer-facing `allEventFeatures`: scope to the firing source, dedupe, then
     * substitute cached typed originals. Scope and dedupe run on the raw features, since
     * `.source` and the rendered id survive only before substitution; the top hit stays first.
     *
     * Scoping leaves only `firingSource`'s hits, so its {@link SourceWithLayers} is resolved once
     * here rather than per feature. For GeoJSON-backed sources we substitute the cached typed
     * original (un-stringified properties, real Dates, nested objects); for everything else — vector
     * tiles, unregistered sources — the MapLibre-rendered feature passes through (`MapGeoJSONFeature
     * extends Feature`).
     */
    private toCallerFeatures(
        rendered: MapGeoJSONFeature[],
        firingFeature: MapGeoJSONFeature | undefined,
        scopedLayerIDs?: Set<string>,
    ): Feature[] {
        const inScope = scopedLayerIDs ? rendered.filter((feature) => scopedLayerIDs.has(feature.layer.id)) : rendered;
        const scoped = dedupeRenderedFeatures(scopeToSource(inScope, firingFeature?.source));
        const sourceWithLayers = this.sourceWithLayersFor(firingFeature?.layer.id);
        return sourceWithLayers instanceof GeoJSONSourceWithLayers
            ? scoped.map((feature) => sourceWithLayers.findById(renderedRefId(feature))?.feature ?? feature)
            : scoped;
    }

    // The features a given handler should see. A layer-scoped handler gets its own narrowed array;
    // everyone else shares the one computed for the source, so the common path costs nothing.
    //
    // A scope is resolved to concrete layer IDs once, against the style's own specs, and those IDs
    // are what narrowing uses. The scope's predicate is not an option here: it matches on
    // `metadata.group`, which the style carries but a feature from `queryRenderedFeatures` does
    // not.
    //
    // Feature predicates are not applied here either — UserEvents applies those, because it also
    // has to promote the first surviving feature to the primary argument.
    private callerFeaturesFor(
        handler: HandlerEntry,
        rendered: MapGeoJSONFeature[],
        firingFeature: MapGeoJSONFeature | undefined,
        shared: Feature[],
    ): Feature[] {
        return handler.scope?.layerFilter ? this.toCallerFeatures(rendered, firingFeature, handler.layerIDs) : shared;
    }

    private getRenderedFeatures(point: Point2D): MapGeoJSONFeature[] {
        if (!this.interactiveLayerIDs.length) {
            return [];
        }
        const options = { layers: this.interactiveLayerIDs, validate: false };
        const precision = this.config.precisionMode;
        // first optional attempt right in the given coordinates:
        const renderedFeatures =
            precision === 'point-then-box' || precision === 'point'
                ? this.map.queryRenderedFeatures(point as PointLike, options)
                : [];
        return renderedFeatures.length || precision === 'point'
            ? renderedFeatures
            : // second attempt using 'box' = padded bounds (trying to hit something slightly further from the pointer location)
              this.map.queryRenderedFeatures(this.toPaddedBounds(point), options);
    }

    private clearLongHoverTimeout() {
        window.clearTimeout(this.longHoverTimeoutHandlerID);
    }

    private restartLongHoverTimeout() {
        this.clearLongHoverTimeout();
        this.longHoverTimeoutHandlerID = window.setTimeout(
            () => this.handleLongHoverTimeout(),
            this.firstDelayedHoverSinceMapMove
                ? this.config.longHoverDelayAfterMapMoveMS
                : this.config.longHoverDelayOnStillMapMS,
        );
    }

    private handleLongHoverTimeout() {
        // We avoid firing long hovers when the feature is in clicked state:
        this.firstDelayedHoverSinceMapMove = false;

        if (this.hoveringSourceWithLayers) {
            updateEventState('long-hover', this.hoveringFeature, undefined, this.hoveringSourceWithLayers, undefined);

            const longHoverHandlers = this.findHandlers(['long-hover'], this.hoveringFeature?.layer.id);

            // Only build `allEventFeatures` when a handler will read it (see onMouseMove).
            if (longHoverHandlers.length) {
                const rendered = this.hoveringFeatures ?? noRenderedFeatures;
                const firing = this.hoveringFeature;
                const shared = this.toCallerFeatures(rendered, firing);
                for (const handler of longHoverHandlers) {
                    const callerFeatures = this.callerFeaturesFor(handler, rendered, firing, shared);
                    handler.fn(
                        callerFeatures[0],
                        this.hoveringLngLat as LngLat,
                        callerFeatures,
                        handler.sourceWithLayers,
                    );
                }
            }
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

    /**
     * Mouse movement arrives far more often than the browser paints, and each pass runs a
     * `queryRenderedFeatures` — by a wide margin the most expensive thing this proxy does. Only
     * the newest position matters by the time anything is drawn, so moves are coalesced into one
     * pass per animation frame and the intermediate ones are dropped.
     *
     * Hover semantics are unaffected: `detectHoverState` compares against the previously handled
     * position, so a coalesced move is indistinguishable from the pointer having travelled
     * straight there.
     */
    private onMouseMove(ev: MapMouseEvent) {
        this.pendingMouseMove = ev;
        if (this.mouseMoveFrameRequested) return;

        this.mouseMoveFrameRequested = true;
        requestAnimationFrame(() => {
            this.mouseMoveFrameRequested = false;
            const latestMove = this.pendingMouseMove;
            this.pendingMouseMove = undefined;
            if (latestMove) {
                this.handleMouseMove(latestMove);
            }
        });
    }

    private handleMouseMove(ev: MapMouseEvent) {
        if (!this.isEnabled()) {
            // We ensure no unwanted hover handling while disabled or the map moves
            return;
        }

        this.hoveringFeatures = this.getRenderedFeatures(ev.point);
        const [hoveredTopFeature] = this.hoveringFeatures;

        // Check if the layer has any handlers registered.
        // Since hover is the "lowest" event type, having a handler for any event type justifies supporting hover state.
        // However, we'll only fire the hover events if there are handlers for hover specifically.
        if (hoveredTopFeature && !this.hasHandlerForLayer(hoveredTopFeature.layer.id)) {
            return;
        }

        // hoverChangeDetected: whether a change happened, such as no-hover -> hover or vice versa:
        // mouseInMotionOverHoveredFeature: whether the mouse is moving along the hovered feature (not stopped on it):
        const { hoverChanged, mouseInMotionOverHoveredFeature } = detectHoverState(
            ev.point,
            hoveredTopFeature,
            this.hoveringPoint,
            this.hoveringFeature,
        );
        if (!hoverChanged && !mouseInMotionOverHoveredFeature) return;

        const prevHoveredFeature = this.hoveringFeature;
        const prevHoveredSourceWithLayers = this.hoveringSourceWithLayers;
        this.hoveringLngLat = ev.lngLat;
        this.hoveringPoint = ev.point;
        this.hoveringFeature = hoveredTopFeature;
        this.hoveringSourceWithLayers = this.sourceWithLayersFor(hoveredTopFeature?.layer.id);

        // Resolved lazily by the `hover` branch so it picks up the marker-added spread that
        // `updateEventState` writes back to `shownFeatures` (matches the click path's dispatch
        // order), then reused by `hover-move` rather than recomputed.
        let callerFeatures: Feature[] | undefined;

        if (hoverChanged) {
            callerFeatures = this.dispatchHoverEnter(ev, prevHoveredFeature, prevHoveredSourceWithLayers);
        }

        if (mouseInMotionOverHoveredFeature) {
            this.dispatchHoverMove(ev, callerFeatures);
        }

        this.restartLongHoverTimeout();
    }

    /**
     * Handles the pointer arriving on a different feature: cursor, `eventState` marker, and the
     * `hover` handlers themselves.
     * @returns the caller-facing features, if they had to be built, so `hover-move` can reuse them.
     */
    private dispatchHoverEnter(
        ev: MapMouseEvent,
        prevHoveredFeature: MapGeoJSONFeature | undefined,
        prevHoveredSourceWithLayers: SourceWithLayers | undefined,
    ): Feature[] | undefined {
        const layerId = this.hoveringFeature?.layer.id;

        // Hovering basic event states are still processed if any other handlers are registered for that source/layers.
        // We do so because basic hovering states indicate a feature is interactive.
        // (e.g. if there's a click handler, we'll still apply basic hover states, even if we don't fire hover events)
        // The top feature is passed here so a feature-scoped handler only claims the cursor for
        // features it actually accepts. The dispatch lookup below deliberately omits it: UserEvents
        // filters the whole stack itself, and may promote a lower feature the top one hid.
        const firstHandler = this.findHandlers(
            ['hover', 'hover-move', 'long-hover', 'click', 'contextmenu'],
            layerId,
            this.hoveringFeature,
        )?.[0];
        this.updateHoverCursor(firstHandler?.config);

        updateEventState(
            'hover',
            this.hoveringFeature,
            prevHoveredFeature,
            this.hoveringSourceWithLayers,
            prevHoveredSourceWithLayers,
        );

        const hoverHandlers = this.findHandlers(['hover'], layerId);
        // Only build `allEventFeatures` (scope + dedupe + substitute) when a handler will read it —
        // hover state above is tracked for the cursor/eventState even without hover handlers, so a
        // click-only module pays nothing here.
        if (!hoverHandlers.length) return undefined;

        const callerFeatures = this.toCallerFeatures(this.hoveringFeatures ?? noRenderedFeatures, this.hoveringFeature);
        this.dispatchToHandlers(hoverHandlers, ev, this.hoveringFeature, callerFeatures);
        return callerFeatures;
    }

    // Handles the pointer travelling along the feature it is already on.
    private dispatchHoverMove(ev: MapMouseEvent, alreadyBuiltFeatures: Feature[] | undefined): void {
        const hoverMoveHandlers = this.findHandlers(['hover-move'], this.hoveringFeature?.layer.id);
        if (!hoverMoveHandlers.length) return;

        const firing = this.hoveringFeature;
        const callerFeatures =
            alreadyBuiltFeatures ?? this.toCallerFeatures(this.hoveringFeatures ?? noRenderedFeatures, firing);
        this.dispatchToHandlers(hoverMoveHandlers, ev, firing, callerFeatures);
    }

    // Calls each handler with the features its own scope allows. Kept parameter-by-parameter
    // rather than bundled into an options object: this runs on the pointer path, and an object
    // literal per call would be garbage collected every frame for no benefit.
    private dispatchToHandlers(
        handlers: HandlerEntry[],
        ev: MapMouseEvent,
        firingFeature: MapGeoJSONFeature | undefined,
        sharedFeatures: Feature[],
    ): void {
        for (const handler of handlers) {
            const handlerFeatures = this.callerFeaturesFor(
                handler,
                this.hoveringFeatures ?? noRenderedFeatures,
                firingFeature,
                sharedFeatures,
            );
            handler.fn(handlerFeatures[0], ev.lngLat, handlerFeatures, handler.sourceWithLayers);
        }
    }

    private updateHoverCursor(config: EventHandlerConfig | undefined) {
        if (this.hoveringFeature) {
            this.mapCanvas.style.cursor = config?.cursorOnHover ?? this.config.cursorOnHover;
        } else {
            this.mapCanvas.style.cursor = this.config.cursorOnMap;
        }
    }

    private onMapClick(clickType: ClickEventType, ev: MapMouseEvent) {
        if (!this.isEnabled()) {
            // We avoid any accidental click handling while disabled or the map moves
            return;
        }

        const clickedFeatures = this.getRenderedFeatures(ev.point);

        const prevClickedFeature = this.lastClickedFeature;
        this.lastClickedFeature = clickedFeatures[0];
        const prevClickedSourceWithLayers = this.lastClickedSourceWithLayers;
        const clickHandlers = this.findHandlers([clickType], this.lastClickedFeature?.layer.id);

        // Resolve from the firing click handler, NOT sourceWithLayersFor(source): the high-priority
        // `click` eventState must only be written when this module actually handles clicks. Otherwise
        // clicking a feature of a hover-only module would stick a `click` marker that later hovers
        // (lower priority) can't clear, freezing its highlight.
        this.lastClickedSourceWithLayers = clickHandlers[0]?.sourceWithLayers;

        updateEventState(
            clickType,
            this.lastClickedFeature,
            prevClickedFeature,
            this.lastClickedSourceWithLayers,
            prevClickedSourceWithLayers,
        );

        // Only build `allEventFeatures` when a handler will read it. onMapClick fires on every
        // map click (no source pre-filter), so a click on empty map or a feature whose module
        // has no click handler does no scope/dedupe/substitution work.
        if (clickHandlers.length) {
            const firing = this.lastClickedFeature;
            const shared = this.toCallerFeatures(clickedFeatures, firing);
            for (const handler of clickHandlers) {
                const callerFeatures = this.callerFeaturesFor(handler, clickedFeatures, firing, shared);
                handler.fn(callerFeatures[0], ev.lngLat, callerFeatures, handler.sourceWithLayers);
            }
        }
    }
}
