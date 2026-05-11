import type { BeforeLayerConfig, MapModuleCommonConfig } from '../../shared';

/**
 * Visual treatment applied to the focused subset by
 * {@link TrafficIncidentOverlayModule.setFocus}.
 *
 * @group Traffic
 */
export type IncidentFocusStyle = {
    /**
     * Colour of the outline painted beneath the focused stripe. Defaults to `#000`.
     */
    outlineColor?: string;

    /**
     * Multiplier applied to the line width of focused features. Defaults to `1.6`.
     * `1` disables the width pop while keeping the outline.
     */
    widthScale?: number;
};

/**
 * Configuration for {@link TrafficIncidentOverlayModule}.
 *
 * @group Traffic
 */
export type TrafficIncidentOverlayConfig = MapModuleCommonConfig & {
    /**
     * Initial visibility of all incident layers. Defaults to `true`.
     * `show()` never flips this flag — if `false`, the module loads data but
     * keeps layers hidden until `setVisible(true)` is called.
     */
    visible?: boolean;

    /**
     * Position incident layers before this map-style layer. Pass `'top'` to
     * pin them above every other layer. Defaults to `'lowestLabel'`, which
     * keeps incidents below map labels (roads, places, POIs) so labels stay
     * readable — the same default the routing, analytics, and geometries
     * modules use.
     */
    beforeLayerConfig?: BeforeLayerConfig;

    /**
     * Visual treatment for {@link TrafficIncidentOverlayModule.setFocus}.
     *
     * - Omit (or `undefined`) — use the SDK default treatment: a black outline
     *   beneath the focused stripe and a `1.6×` width pop.
     * - `false` — disable the visual treatment. `setFocus(ids)` still writes
     *   MapLibre `feature-state.focused`, so callers can drive their own
     *   styling (extra layers, sidebar overlays, …) off that state.
     * - `{ outlineColor?, widthScale? }` — override individual fields of the
     *   default treatment.
     */
    focus?: false | IncidentFocusStyle;
};
