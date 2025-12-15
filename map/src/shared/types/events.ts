import type { LngLat, MapGeoJSONFeature } from 'maplibre-gl';
import type { SourceWithLayers } from './mapsSDKLayerSpecs';

/**
 * Subtype for click events.
 *
 * @remarks
 * - `click`: Regular left-click or tap on touch devices
 * - `contextmenu`: Right-click (or long-press on touch devices)
 *
 * @example
 * ```typescript
 * const clickType: ClickEventType = 'click';
 * const rightClick: ClickEventType = 'contextmenu';
 * ```
 *
 * @group User Interaction Events
 */
export type ClickEventType = 'click' | 'contextmenu';

/**
 * Subtype for hover events with timing distinction.
 *
 * @remarks
 * - `hover`: Immediate hover when cursor enters a feature
 * - `long-hover`: Triggered after hovering for a configured duration (typically 300-800ms)
 *
 * Long-hover is useful for showing detailed tooltips or previews without
 * cluttering the UI during quick mouse movements.
 *
 * @example
 * ```typescript
 * const quickHover: HoverEventType = 'hover';
 * const sustainedHover: HoverEventType = 'long-hover';
 * ```
 *
 * @group User Interaction Events
 */
export type HoverEventType = 'hover' | 'long-hover';

/**
 * Type of user event supported by the SDK beyond basic MapLibre support.
 *
 * @remarks
 * The SDK extends MapLibre's basic event handling with additional event types
 * that are commonly needed for interactive map features.
 *
 * @example
 * ```typescript
 * const eventType: EventType = 'click';
 * const hoverEvent: EventType = 'long-hover';
 * ```
 *
 * @group User Interaction Events
 */
export type EventType = ClickEventType | HoverEventType;

/**
 * Parameters to identify a feature by its ID or index in a given features array.
 * @group User Interaction Events
 */
export type ByIdOrIndex =
    | {
          /**
           * The unique identifier of the feature.
           *
           * @remarks
           * This ID corresponds to the `id` property of the feature being targeted.
           * Cannot be used together with `index`.
           */
          id: string;
      }
    | {
          /**
           * The index of the feature in the feature array.
           *
           * @remarks
           * Zero-based index referring to the position in the features array
           * that was passed to the module's show method.
           * Cannot be used together with `id`.
           */
          index: number;
      };

/**
 * Parameters to update the event state of a feature programmatically.
 *
 * Allows you to manually set event states on features, useful for:
 * - Programmatic selection/highlighting
 * - Keyboard navigation
 * - External state synchronization
 * - Testing and automation
 *
 * @example
 * ```typescript
 * // Select a feature programmatically
 * const options: PutEventStateOptions = {
 *   index: 0,
 *   state: 'click',
 *   mode: 'put',  // Remove click state from other features
 *   show: true
 * };
 *
 * // Add hover state without affecting others
 * const hoverOptions: PutEventStateOptions = {
 *   index: 2,
 *   state: 'hover',
 *   mode: 'add',  // Keep other hover states
 *   show: true
 * };
 * ```
 *
 * @group User Interaction Events
 */
export type PutEventStateOptions = ByIdOrIndex & {
    /**
     * The event state to set.
     *
     * @remarks
     * Can be any supported event type: 'click', 'contextmenu', 'hover', or 'long-hover'.
     */
    state: EventType;

    /**
     * Whether to replace or add to existing event states.
     *
     * @remarks
     * - `put`: Set the event state on this feature and remove it from all others (default)
     * - `add`: Set the event state on this feature while preserving states on other features
     *
     * @default 'put'
     *
     * @example
     * ```typescript
     * // Exclusive selection (only one can be clicked at a time)
     * mode: 'put'
     *
     * // Multiple selection (keep existing selections)
     * mode: 'add'
     * ```
     */
    mode?: 'put' | 'add';

    /**
     * Whether to show the feature after updating the event state.
     *
     * @remarks
     * Set to false only if you want to make multiple state changes before
     * rendering, which can improve performance for batch updates.
     *
     * @default true
     *
     * @example
     * ```typescript
     * // Update and render immediately
     * show: true
     *
     * // Update without rendering (for batch operations)
     * show: false
     * ```
     */
    show?: boolean;
};

/**
 * Parameters to clean the event state from a specific feature.
 *
 * Removes event states from a feature, returning it to its normal appearance.
 * Useful for deselecting or unhighlighting features programmatically.
 *
 * @example
 * ```typescript
 * // Remove all event states from a feature
 * const options: CleanEventStateOptions = {
 *   index: 0,
 *   show: true
 * };
 *
 * // Clean without immediately rendering
 * const batchOptions: CleanEventStateOptions = {
 *   index: 5,
 *   show: false
 * };
 * ```
 *
 * @group User Interaction Events
 */
export type CleanEventStateOptions = ByIdOrIndex & {
    /**
     * Whether to show the feature after cleaning the event state.
     *
     * @remarks
     * Set to false only if you want to keep manipulating features before
     * showing them, which can improve performance for batch updates.
     *
     * @default true
     */
    show?: boolean;
};

/**
 * Parameters to clean event states for a collection of shown features.
 *
 * Bulk operation for removing event states from multiple features at once.
 * More efficient than cleaning features individually.
 *
 * @example
 * ```typescript
 * // Remove all event states from all features
 * const cleanAll: CleanEventStatesOptions = {};
 *
 * // Remove only click states
 * const cleanClicks: CleanEventStatesOptions = {
 *   states: ['click']
 * };
 *
 * // Remove hover states without rendering
 * const cleanHovers: CleanEventStatesOptions = {
 *   states: ['hover', 'long-hover'],
 *   show: false
 * };
 * ```
 *
 * @group User Interaction Events
 */
export type CleanEventStatesOptions = {
    /**
     * The event states to clean.
     *
     * @remarks
     * If not supplied, all event states will be cleaned from all features.
     *
     * @example
     * ```typescript
     * // Clean only click states
     * states: ['click']
     *
     * // Clean all hover-related states
     * states: ['hover', 'long-hover']
     *
     * // Clean everything (same as omitting)
     * states: ['click', 'contextmenu', 'hover', 'long-hover']
     * ```
     */
    states?: EventType[];

    /**
     * Whether to show the feature after cleaning the event state.
     *
     * @remarks
     * Set to false only if you want to keep manipulating features before
     * showing them, which can improve performance for batch updates.
     *
     * @default true
     */
    show?: boolean;
};

/**
 * Properties part for an object that can have event state.
 *
 * Features with this type can store their current event state (click, hover, etc.),
 * which is used for styling and interaction handling.
 *
 * @remarks
 * This is typically mixed into feature properties to track interactive states.
 * The SDK automatically manages these states based on user interactions.
 *
 * @example
 * ```typescript
 * // Feature with click state
 * const featureProps: SupportsEvents = {
 *   eventState: 'click'
 * };
 *
 * // Feature with hover state
 * const hoveredProps: SupportsEvents = {
 *   eventState: 'hover'
 * };
 *
 * // Feature with no event state
 * const normalProps: SupportsEvents = {};
 * ```
 *
 * @group User Interaction Events
 */
export type SupportsEvents = {
    /**
     * Current event state of the feature.
     *
     * @remarks
     * - `undefined`: No active event state (normal appearance)
     * - Event type: Active state that affects styling and behavior
     *
     * This property is automatically managed by the SDK based on user
     * interactions and programmatic state changes.
     */
    eventState?: EventType;
};

/**
 * Handler function for user interaction events on map features.
 *
 * @remarks
 * Called when a user interacts with features on the map (e.g., click, hover).
 * Provides detailed information about the interacted feature, its location,
 * and all features at the event coordinates.
 *
 * **Feature Type Mapping:**
 * - **GeoJSON modules** (places, routes, geometries): `topFeature` is the original feature passed to the `show()` method
 * - **Vector tile modules** (POIs, traffic): `topFeature` is derived from MapLibre's internal feature representation
 *
 * **Event Precision:**
 * - The `lngLat` coordinates may be near but not exactly on the feature, depending on the precision mode
 * - The precision behavior is controlled by `MapEventsConfig.precisionMode`
 *
 * @typeParam T - The type of the top feature being interacted with
 *
 * @param topFeature - The primary target feature for the event, positioned on top of any overlapping features
 * @param lngLat - The geographic coordinates where the event occurred
 * @param allEventFeatures - All features matching the event coordinates across all map modules, as raw MapLibre GeoJSON features. The first feature corresponds to `topFeature`
 * @param sourceWithLayers - The source and layer configuration to which the `topFeature` belongs
 *
 * @example
 * Click handler for route features:
 * ```ts
 * routingModule.on('click', (route, lngLat, allFeatures, source) => {
 *   console.log('Clicked route:', route.properties.id);
 *   console.log('At coordinates:', lngLat);
 *   console.log('Total features at location:', allFeatures.length);
 * });
 * ```
 *
 * @example
 * Hover handler for places with feature inspection:
 * ```ts
 * placesModule.on('mousemove', (place, lngLat, allFeatures, source) => {
 *   // Show tooltip with place information
 *   showTooltip({
 *     title: place.properties.poi?.name,
 *     address: place.properties.address.freeformAddress,
 *     coordinates: lngLat
 *   });
 *
 *   // Check for overlapping features
 *   if (allFeatures.length > 1) {
 *     console.log(`${allFeatures.length} features at this location`);
 *   }
 * });
 * ```
 *
 * @see {@link EventsModule.on} - For registering event handlers
 *
 * @group User Interaction Events
 */
export type UserEventHandler<T> = (
    topFeature: T,
    lngLat: LngLat,
    allEventFeatures: MapGeoJSONFeature[],
    sourceWithLayers: SourceWithLayers,
) => void;

/**
 * Allowed CSS cursor styles for map interactions.
 *
 * @group User Interaction Events
 */
export type CSSCursor =
    | 'alias'
    | 'all-scroll'
    | 'auto'
    | 'cell'
    | 'context-menu'
    | 'col-resize'
    | 'copy'
    | 'crosshair'
    | 'default'
    | 'e-resize'
    | 'ew-resize'
    | 'grab'
    | 'grabbing'
    | 'help'
    | 'move'
    | 'n-resize'
    | 'ne-resize'
    | 'nesw-resize'
    | 'ns-resize'
    | 'nw-resize'
    | 'nwse-resize'
    | 'no-drop'
    | 'none'
    | 'not-allowed'
    | 'pointer'
    | 'progress'
    | 'row-resize'
    | 's-resize'
    | 'se-resize'
    | 'sw-resize'
    | 'text'
    | 'vertical-text'
    | 'w-resize'
    | 'wait'
    | 'zoom-in'
    | 'zoom-out';

/**
 * Event configuration options related to how the cursor appears during interactions.
 *
 * @group User Interaction Events
 */
export type EventHandlerCursorConfig = {
    /**
     * Optional configuration to show custom cursor when hovering over interactive features.
     *
     * @remarks
     * Accepts any valid CSS cursor value.
     *
     * @default 'pointer'
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor | MDN cursor documentation}
     *
     * @example
     * ```typescript
     * // Default pointer
     * cursorOnHover: 'pointer'
     *
     * // Crosshair for precise selection
     * cursorOnHover: 'crosshair'
     *
     * // Help cursor for info bubbles
     * cursorOnHover: 'help'
     *
     * // Custom cursor image
     * cursorOnHover: 'url(/cursors/custom.png), pointer'
     * ```
     */
    cursorOnHover?: CSSCursor;
};

/**
 * Optional events configuration for a map module.
 *
 * @group User Interaction Events
 */
export type EventHandlerConfig = EventHandlerCursorConfig;
