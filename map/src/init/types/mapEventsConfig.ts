/**
 * Configuration options for map user event handling.
 *
 * Controls how user interactions (clicks, hovers) are detected and processed,
 * including precision modes, cursor styles, and timing behaviors.
 *
 * @remarks
 * These settings affect all interactive map modules (places, POIs, routes, etc.).
 * Fine-tuning these values can improve user experience based on your use case.
 *
 * @example
 * ```typescript
 * // Default configuration for desktop
 * const config: MapEventsConfig = {
 *   precisionMode: 'box',
 *   paddingBoxPx: 5,
 *   cursorOnHover: 'pointer',
 *   longHoverDelayOnStillMapMS: 300
 * };
 *
 * // Mobile-optimized with larger hit area
 * const mobileConfig: MapEventsConfig = {
 *   precisionMode: 'box',
 *   paddingBoxPx: 15,  // Larger touch targets
 *   longHoverDelayAfterMapMoveMS: 1000
 * };
 *
 * // Precise picking for dense data
 * const preciseConfig: MapEventsConfig = {
 *   precisionMode: 'point',  // Exact pixel matching
 *   cursorOnHover: 'crosshair'
 * };
 * ```
 *
 * @group Map
 * @category Types
 */
export type MapEventsConfig = {
    /**
     * Defines the event coordinates precision mode.
     *
     * @remarks
     * **Modes:**
     * - `box`: Features are queried within a padding box around the event point (default)
     * - `point`: Features are queried at the exact event point (most precise)
     * - `point-then-box`: Try point first, then fall back to box if nothing found
     *
     * **Use Cases:**
     * - `box`: Best for general use, easier to click small features
     * - `point`: Precise picking for dense overlapping features
     * - `point-then-box`: Balance between precision and usability
     *
     * @default 'box'
     *
     * @example
     * ```typescript
     * // Easier interaction with padding
     * precisionMode: 'box'
     *
     * // Exact pixel matching
     * precisionMode: 'point'
     *
     * // Adaptive approach
     * precisionMode: 'point-then-box'
     * ```
     */
    precisionMode?: 'box' | 'point' | 'point-then-box';

    /**
     * Optional padding box to be inserted around the event point, in pixels.
     *
     * @remarks
     * Ignored if `precisionMode` is set to `"point"`.
     *
     * **Guidelines:**
     * - Desktop: 5-10px for comfortable clicking
     * - Mobile/touch: 10-20px for finger-friendly targets
     * - Dense data: 3-5px to avoid unintended selections
     *
     * @default 5
     *
     * @example
     * ```typescript
     * // Standard desktop
     * paddingBoxPx: 5
     *
     * // Mobile-friendly
     * paddingBoxPx: 15
     *
     * // Precise selection
     * paddingBoxPx: 2
     * ```
     */
    paddingBoxPx?: number;

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
    cursorOnHover?: string;

    /**
     * Optional configuration to show custom cursor when clicking (mouse down).
     *
     * @remarks
     * Accepts any valid CSS cursor value. Provides visual feedback during the
     * click action.
     *
     * @default 'grabbing'
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor | MDN cursor documentation}
     *
     * @example
     * ```typescript
     * // Grabbing hand
     * cursorOnMouseDown: 'grabbing'
     *
     * // Move cursor
     * cursorOnMouseDown: 'move'
     *
     * // Custom cursor
     * cursorOnMouseDown: 'url(/cursors/drag.png), grabbing'
     * ```
     */
    cursorOnMouseDown?: string;

    /**
     * Optional configuration to show custom cursor on the map canvas.
     *
     * @remarks
     * Accepts any valid CSS cursor value. This is the default cursor shown
     * when not interacting with any features.
     *
     * @default 'default'
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/cursor | MDN cursor documentation}
     *
     * @example
     * ```typescript
     * // Standard arrow
     * cursorOnMap: 'default'
     *
     * // Open hand for draggable map
     * cursorOnMap: 'grab'
     *
     * // Crosshair for measurement tools
     * cursorOnMap: 'crosshair'
     * ```
     */
    cursorOnMap?: string;

    /**
     * Delay to trigger a long-hover event when map has just moved (milliseconds).
     *
     * @remarks
     * Right after the map has moved, the first long-hover waits longer to prevent
     * unwanted hovers while panning the map. This improves UX by not showing
     * tooltips immediately after map movement.
     *
     * Should be higher than `longHoverDelayOnStillMapMS`.
     *
     * @default 800
     *
     * @example
     * ```typescript
     * // Default delay after map movement
     * longHoverDelayAfterMapMoveMS: 800
     *
     * // Faster for responsive UI
     * longHoverDelayAfterMapMoveMS: 500
     *
     * // Longer to avoid accidental triggers
     * longHoverDelayAfterMapMoveMS: 1200
     * ```
     */
    longHoverDelayAfterMapMoveMS?: number;

    /**
     * Delay to trigger a long-hover event when the map was still since the last long hover (milliseconds).
     *
     * @remarks
     * Once the map is stationary and the user is actively exploring, subsequent
     * long-hovers trigger faster for a more responsive experience.
     *
     * Should be lower than `longHoverDelayAfterMapMoveMS`.
     *
     * @default 300
     *
     * @example
     * ```typescript
     * // Default quick hover
     * longHoverDelayOnStillMapMS: 300
     *
     * // Instant hover
     * longHoverDelayOnStillMapMS: 100
     *
     * // Slower for less frequent updates
     * longHoverDelayOnStillMapMS: 500
     * ```
     */
    longHoverDelayOnStillMapMS?: number;
};
