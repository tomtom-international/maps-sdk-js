import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { AnyMapModule } from './AbstractEventProxy';
import type { EventsProxy } from './EventsProxy';
import { combineEventScopes, type EventScope, type ResolvedEventScope } from './eventScope';
import type { EventHandlerConfig, EventType, SourceWithLayers, UserEventHandler } from './types';

/**
 * Everything {@link UserEvents} needs to register handlers for one scope of one module.
 * @ignore
 */
export type UserEventsOptions<T, WHERE_SCOPE> = {
    eventProxy: EventsProxy;
    /**
     * The source(s) whose features this scope handles events for. Several sources back one scope
     * when they carry the same data in different display modes — hexgrid, square and heatmap in
     * {@link TrafficAreaAnalyticsModule}, clustered and unclustered places in {@link PlacesModule}.
     */
    sourcesWithLayers: SourceWithLayers[];
    /**
     * The module that owns these sources. Kept with every handler so a style-change restore can
     * tell handlers apart when two modules share one MapLibre source ID.
     */
    owner: AnyMapModule;
    /**
     * Event configuration for every handler registered through this instance — the hover cursor,
     * chiefly. A scope built by {@link UserEvents.where} inherits the module's unless `where` is
     * given one of its own, which is how two parts of one module get different cursors.
     */
    config?: EventHandlerConfig;
    /**
     * Transforms a raw {@link MapGeoJSONFeature} into the feature type `T` this scope exposes, so
     * callers receive the module's own feature shape. Applied before handlers and before any
     * {@link UserEvents.where} predicate, so a predicate also sees `T`.
     */
    mapping?: (feature: MapGeoJSONFeature) => T;
    /** The scope already applied to this instance, if it came from {@link UserEvents.where}. */
    scope?: ResolvedEventScope;
    /**
     * Turns a module-specific scope object into a {@link ResolvedEventScope}. Only modules with a
     * typed layer vocabulary supply one — today that is {@link BaseMapModule} and its layer groups.
     */
    scopeResolver?: (scope: WHERE_SCOPE) => ResolvedEventScope;
};

/**
 * Event handling interface for map features.
 *
 * Provides a simple API for attaching and removing event handlers for user interactions
 * with map features such as clicks, hovers, and context menus. Each map module (POIs, Routing,
 * Places, etc.) exposes an `events` property that returns a `UserEvents` instance.
 *
 * @typeParam T - The feature type returned in event handlers (extends MapGeoJSONFeature)
 *
 * @remarks
 * **Supported Event Types:**
 * - `click`: User clicks/taps on a feature
 * - `contextmenu`: User right-clicks on a feature (or long-press on mobile)
 * - `hover`: Mouse enters a feature
 * - `long-hover`: Mouse hovers over feature for configured duration (300-800ms)
 *
 * **Event Handler Signature:**
 * ```typescript
 * (feature: T, lngLat: LngLat, features: T[]) => void
 * ```
 *
 * **Parameters:**
 * - `feature`: The primary feature under the cursor
 * - `lngLat`: Geographic coordinates of the event
 * - `features`: All features at this location (when multiple overlap)
 *
 * **Key Features:**
 * - Automatic cursor management (pointer on hover)
 * - Smart event handling for overlapping features
 * - Configurable hover delays
 * - Memory-safe cleanup when removing handlers
 *
 * @example
 * ```typescript
 * // POI click handler
 * const pois = map.pois();
 * pois.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked POI:', feature.properties.name);
 *   console.log('Location:', lngLat);
 *   showInfoWindow(feature.properties);
 * });
 *
 * // Route waypoint hover
 * const routing = map.routing();
 * routing.events.waypoints.on('hover', (waypoint) => {
 *   showTooltip(`Waypoint ${waypoint.properties.index}`);
 * });
 *
 * // Long-hover for detailed info
 * pois.events.on('long-hover', (feature) => {
 *   loadAndShowDetailedInfo(feature.properties.id);
 * });
 *
 * // Context menu (right-click)
 * routing.events.mainLines.on('contextmenu', (route, lngLat) => {
 *   showContextMenu(lngLat, [
 *     { label: 'Add waypoint here', action: () => addWaypoint(lngLat) },
 *     { label: 'View route details', action: () => showDetails(route) }
 *   ]);
 * });
 *
 * // Remove all click handlers
 * pois.events.off('click');
 * ```
 *
 * @example
 * ```typescript
 * // Complete interaction example
 * const places = map.places();
 *
 * // Show name on hover
 * places.events.on('hover', (place) => {
 *   tooltip.show(place.properties.name);
 * });
 *
 * // Show details on click
 * places.events.on('click', (place, lngLat) => {
 *   sidebar.show({
 *     title: place.properties.name,
 *     address: place.properties.address.freeformAddress,
 *     coordinates: lngLat
 *   });
 * });
 *
 * // Cleanup on component unmount
 * onUnmount(() => {
 *   places.events.off('hover');
 *   places.events.off('click');
 * });
 * ```
 *
 * @group Events
 */
export class UserEvents<T = MapGeoJSONFeature, WHERE_SCOPE = never> {
    private readonly sources: SourceWithLayers[];
    private readonly options: UserEventsOptions<T, WHERE_SCOPE>;

    constructor(options: UserEventsOptions<T, WHERE_SCOPE>) {
        this.options = options;
        this.sources = options.sourcesWithLayers;
    }

    /**
     * Narrows these events to part of what they cover, returning a {@link UserEvents} over just
     * that part.
     *
     * Two things can be narrowed. A **feature predicate** keeps only the features you care about —
     * available on every module, since only the module's own data can tell a major incident from a
     * minor one. A **layer scope** keeps only part of the map's layers; the SDK offers this where
     * a stable, typed vocabulary for those layers exists, which today means
     * {@link BaseMapModule}'s layer groups.
     *
     * A new instance, rather than this one narrowed in place: callers hold `events` and narrow it
     * more than once, and mutating would make the second `where()` mean "first AND second" while
     * leaving the surface it came from silently scoped — and its `config` overridden.
     *
     * Narrowing on both axes is one call, not two — {@link BaseMapModule}'s scope object takes a
     * `features` predicate alongside its `layerGroups`. A further `where()` does intersect with
     * this one, but two feature predicates read better as a single `a(f) && b(f)`.
     *
     * @param scope See {@link EventScope} — a predicate over this scope's feature type, or, where
     * the module supports one, a scope object such as `{ layerGroups }`.
     * @param config Event configuration for handlers registered through the returned instance.
     * Each scope can carry its own, which is how two parts of one module get different hover
     * cursors. Defaults to the configuration this instance already uses.
     *
     * @example
     * ```typescript
     * // Feature scope: only major incidents are clickable.
     * trafficIncidents.events.where((incident) => incident.properties.magnitude === 'major')
     *     .on('click', showIncidentDetails);
     *
     * // Layer scope with its own cursor, on the base map.
     * baseMap.events
     *     .where({ layerGroups: { mode: 'include', names: ['roadLabels'] } }, { cursorOnHover: 'pointer' })
     *     .on('click', showRoadName);
     *
     * // A named scope, narrowed by a predicate.
     * routing.events.tunnels.where((section) => section.properties.lengthInMeters > 500)
     *     .on('click', showLongTunnel);
     * ```
     */
    where(scope: EventScope<T, WHERE_SCOPE>, config?: EventHandlerConfig): UserEvents<T, WHERE_SCOPE> {
        return new UserEvents<T, WHERE_SCOPE>({
            ...this.options,
            config: config ?? this.options.config,
            scope: combineEventScopes(this.options.scope, this.resolveScope(scope)),
        });
    }

    // Turns whatever `where()` was handed into the two predicates the event proxy understands.
    // A bare function is a feature predicate over `T`, so the module's mapping is composed in
    // front of it — the caller's predicate must see the module's feature type, not MapLibre's.
    private resolveScope(scope: EventScope<T, WHERE_SCOPE>): ResolvedEventScope {
        if (typeof scope === 'function') {
            const predicate = scope as (feature: T) => boolean;
            const mapping = this.options.mapping;
            return {
                featureMatches: mapping
                    ? (feature) => predicate(mapping(feature))
                    : (feature) => predicate(feature as T),
            };
        }

        const resolver = this.options.scopeResolver;
        if (!resolver) {
            throw new Error('This module supports only feature predicates in events.where().');
        }

        return resolver(scope);
    }

    /**
     * Register an event handler for user interactions with map features.
     *
     * Attaches a callback function that will be invoked when users interact with
     * features in this module (e.g., clicking on a POI, hovering over a route).
     *
     * @param type The type of event to listen for (click, contextmenu, hover, long-hover)
     * @param handler Callback function invoked when the event occurs
     *
     * @returns An unsubscribe function that removes the handler registered by this call.
     *
     * @remarks
     * **Handler Parameters:**
     * - `feature`: The primary feature that triggered the event
     * - `lngLat`: Geographic coordinates [longitude, latitude] of the event
     * - `features`: The features from this module at the event location, de-duplicated (for
     *   overlapping features within the module). To inspect features across all modules, query
     *   `map.mapLibreMap.queryRenderedFeatures(...)` directly — see {@link UserEventHandler}.
     *
     * **Behavior:**
     * - Multiple handlers per event type are supported — each `on()` adds a handler (it does
     *   **not** replace existing ones) and all of them fire. To remove one, call the unsubscribe
     *   this returns; to clear them all, use `off(type)`.
     * - Handlers are preserved across map style changes
     * - Cursor automatically changes to pointer on hover
     * - Events respect module visibility (hidden features don't trigger events)
     *
     * **Performance:**
     * - Hover events use spatial indexing for fast lookup
     * - Long-hover has configurable delay to prevent accidental triggers
     * - Event handlers should be lightweight to maintain smooth interaction
     *
     * @example
     * ```typescript
     * // Basic click handler
     * module.events.on('click', (feature, lngLat, features) => {
     *   console.log('Clicked feature:', feature.properties);
     *   console.log('Location:', lngLat);
     *   console.log('All features here:', features.length);
     * });
     *
     * // Hover with tooltip
     * module.events.on('hover', (feature) => {
     *   const name = feature.properties.name || 'Unnamed';
     *   tooltip.show(name);
     * });
     *
     * // Long-hover for detailed preview
     * module.events.on('long-hover', (feature) => {
     *   // Only triggered after hovering for 300-800ms
     *   loadPreview(feature.properties.id);
     * });
     *
     * // Right-click context menu
     * module.events.on('contextmenu', (feature, lngLat) => {
     *   event.preventDefault(); // Prevent browser context menu
     *   showCustomMenu(lngLat, feature);
     * });
     * ```
     *
     * @example
     * ```typescript
     * // Route-specific handlers
     * const routing = map.routing();
     *
     * // Handle route line clicks
     * routing.events.mainLines.on('click', (route) => {
     *   highlightRoute(route.properties.routeID);
     *   showRouteSummary(route.properties.summary);
     * });
     *
     * // Handle waypoint interactions
     * routing.events.waypoints.on('hover', (waypoint) => {
     *   const index = waypoint.properties.index;
     *   showTooltip(`Stop ${index + 1}`);
     * });
     * ```
     */
    on(type: EventType, handler: UserEventHandler<T>): () => void {
        const { eventProxy, config, owner, scope } = this.options;
        const registeredHandler = this.toRegisteredHandler(handler);
        const entries: SourceWithLayers[] = [];

        for (const source of this.sources) {
            eventProxy.addEventHandler(source, registeredHandler, type, { config, owner, scope });
            entries.push(source);
        }

        return () => {
            for (const source of entries) {
                eventProxy.removeHandler(source, type, registeredHandler);
            }
        };
    }

    // Wraps the caller's handler with everything that has to happen between the event proxy and
    // the caller: the module's feature mapping, and any feature predicate this scope carries.
    private toRegisteredHandler(handler: UserEventHandler<T>): UserEventHandler<any> {
        const { mapping, scope } = this.options;
        const featureMatches = scope?.featureMatches;

        if (!mapping && !featureMatches) return handler as UserEventHandler<any>;

        const toExposed = (feature: MapGeoJSONFeature) => (mapping ? mapping(feature) : (feature as T));

        if (!featureMatches) {
            return (feature, lngLat, features, sourceWithLayers) =>
                handler(toExposed(feature), lngLat, features.map(toExposed), sourceWithLayers);
        }

        // A predicate filters the whole stack of features under the pointer and promotes the first
        // survivor to the primary argument, so clicking a stack whose top hit is a minor incident
        // and whose second is major still reaches a `magnitude === 'major'` handler with the major
        // one. When nothing in the stack matches, the handler is not called at all.
        return (feature, lngLat, features, sourceWithLayers) => {
            const stack = features.length ? features : [feature];
            const inScope = stack.filter((candidate) => featureMatches(candidate));
            if (!inScope.length) return;

            const exposed = inScope.map(toExposed);
            handler(exposed[0], lngLat, exposed, sourceWithLayers);
        };
    }

    /**
     * Remove all event handlers for a specific event type.
     *
     * Unregisters the callback function for the specified event type, stopping
     * further event notifications. This is important for cleanup to prevent
     * memory leaks and unwanted behavior.
     *
     * @param type The type of event to stop listening for
     *
     * @remarks
     * **Cleanup Behavior:**
     * - Removes **all** handlers for the specified event type — to remove a single handler, call
     *   the unsubscribe function returned by {@link on}
     * - Other event types remain active
     * - Resets cursor behavior for this module
     * - Safe to call multiple times (no error if no handler exists)
     * - Does not affect other modules' event handlers
     *
     * **When to Use:**
     * - Component unmounting/cleanup
     * - Switching between interaction modes
     * - Temporarily disabling interactions
     * - Replacing an existing handler (call `off()` then `on()`)
     *
     * **Best Practices:**
     * - Always clean up event handlers when component unmounts
     * - Remove handlers before removing features from the map
     * - Use framework lifecycle hooks for automatic cleanup
     *
     * @example
     * ```typescript
     * // Remove click handlers
     * module.events.off('click');
     *
     * // Remove all handlers
     * module.events.off('click');
     * module.events.off('hover');
     * module.events.off('long-hover');
     * module.events.off('contextmenu');
     * ```
     *
     * @example
     * ```typescript
     * // React component cleanup
     * useEffect(() => {
     *   const pois = map.pois();
     *
     *   pois.events.on('click', handlePoiClick);
     *   pois.events.on('hover', handlePoiHover);
     *
     *   return () => {
     *     // Cleanup on unmount
     *     pois.events.off('click');
     *     pois.events.off('hover');
     *   };
     * }, [map]);
     * ```
     *
     * @example
     * ```typescript
     * // Replace handler
     * module.events.off('click'); // Remove old handler
     * module.events.on('click', newHandler); // Add new handler
     *
     * // Disable interactions temporarily
     * const savedHandler = currentHandler;
     * module.events.off('click'); // Disable
     * // ... later ...
     * module.events.on('click', savedHandler); // Re-enable
     * ```
     */
    off(type: EventType) {
        for (const source of this.sources) {
            this.options.eventProxy.remove(source, type, this.options.owner);
        }
    }
}
