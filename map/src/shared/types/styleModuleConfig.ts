/**
 * Initialization configuration for style-based map modules.
 *
 * @remarks
 * This type controls how modules handle missing style components during initialization.
 * Use `ensureAddedToStyle` to dynamically load missing sources and layers, or leave it
 * false to fail fast if required style components are missing.
 *
 * @group Map Style
 */
export type StyleModuleInitConfig = {
    /**
     * Controls whether the module will automatically add missing sources and layers to the style.
     *
     * @remarks
     * **When `true`:**
     * - The module ensures all required sources and layers are present in the style
     * - If any are missing, the style will be **reloaded** with the missing components
     * - Useful for lazy-loading modules to optimize initial map load time
     *
     * **When `false`:**
     * - The module expects all required sources and layers to already be in the style
     * - Throws an error if any required components are missing
     * - Provides faster initialization with clear error messages
     *
     * **Warning:** If you set this to `true` and have added custom sources or layers
     * to the style, you must listen to the style change event and re-add them, as the
     * style reload will remove your custom additions.
     *
     * @default false
     *
     * @example
     * ```typescript
     * // Lazy-load traffic module after map initialization
     * const trafficModule = await map.addModule(tt.TrafficModule, {
     *   ensureAddedToStyle: true,
     *   visible: true
     * });
     *
     * // Require traffic to be in initial style (fail fast if missing)
     * const trafficModule = await map.addModule(tt.TrafficModule, {
     *   ensureAddedToStyle: false,
     *   visible: true
     * });
     *
     * // Handle custom layers when using ensureAddedToStyle
     * map.on('style.load', () => {
     *   // Re-add your custom sources and layers here
     *   map.addSource('my-custom-source', { ... });
     *   map.addLayer({ id: 'my-custom-layer', ... });
     * });
     * ```
     */
    ensureAddedToStyle?: boolean;
};

/**
 * Base configuration type for all style-based map modules.
 *
 * @remarks
 * This is the base type extended by all Maps SDK modules that rely on vector tile
 * sources and layers in the loaded map style (e.g., BaseMapModule, TrafficModule,
 * POIsModule).
 *
 * Runtime configuration properties defined here can be updated after module
 * initialization using the module's `updateConfig()` method.
 *
 * @group Map Style
 */
export type StyleModuleConfig = {
    /**
     * Controls the visibility of all layers associated with this module.
     *
     * @remarks
     * This property can be updated at runtime using the module's `updateConfig()` method.
     * All layers belonging to the module will be shown or hidden accordingly.
     *
     * @default true
     *
     * @example
     * ```typescript
     * // Hide traffic layers
     * trafficModule.updateConfig({ visible: false });
     *
     * // Show traffic layers
     * trafficModule.updateConfig({ visible: true });
     * ```
     */
    visible?: boolean;
};
