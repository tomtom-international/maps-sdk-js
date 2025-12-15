import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { EventsProxy } from './EventsProxy';
import type { EventHandlerConfig, EventType, SourceWithLayers, UserEventHandler } from './types';

/**
 * Event handling interface for map features.
 *
 * Provides a simple API for attaching and removing event handlers for user interactions
 * with map features such as clicks, hovers, and context menus. Each map module (POIs, Routing,
 * Places, etc.) exposes an `events` property that returns an EventsModule instance.
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
 * @group User Interaction Events
 */
export class EventsModule<T = MapGeoJSONFeature> {
    constructor(
        private readonly eventProxy: EventsProxy,
        private readonly sourceWithLayers: SourceWithLayers,
        private readonly config: EventHandlerConfig | undefined,
    ) {}

    /**
     * Register an event handler for user interactions with map features.
     *
     * Attaches a callback function that will be invoked when users interact with
     * features in this module (e.g., clicking on a POI, hovering over a route).
     *
     * @param type The type of event to listen for (click, contextmenu, hover, long-hover)
     * @param handler Callback function invoked when the event occurs
     *
     * @remarks
     * **Handler Parameters:**
     * - `feature`: The primary feature that triggered the event
     * - `lngLat`: Geographic coordinates [longitude, latitude] of the event
     * - `features`: Array of all features at the event location (for overlapping features)
     *
     * **Behavior:**
     * - Only one handler per event type (calling `on()` again replaces the previous handler)
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
    on(type: EventType, handler: UserEventHandler<T>) {
        this.eventProxy.addEventHandler(this.sourceWithLayers, handler, type, this.config);
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
     * - Removes only the specified event type (other types remain active)
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
        this.eventProxy.remove(this.sourceWithLayers, type);
    }
}
