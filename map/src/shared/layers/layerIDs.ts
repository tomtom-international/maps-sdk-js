/**
 * Key layer IDs from the vector map style for positioning custom layers.
 *
 * @remarks
 * This constant provides reference layer IDs from TomTom's vector map styles that are used
 * as anchors when positioning custom layers in the map's layer stack. By referencing these
 * layer IDs, SDK modules and custom implementations can control where their layers appear
 * in the rendering order (visual stacking).
 *
 * **Understanding Layer Order:**
 *
 * "Lowest" refers to position in the layer stack, not physical elevation. Layers are rendered
 * from bottom to top - layers lower in the stack are drawn first and appear underneath layers
 * higher in the stack. When you add a layer "before" a reference layer, it's inserted lower
 * in the stack and will be drawn underneath that reference layer.
 *
 * **How SDK Modules Use These IDs:**
 *
 * **RoutingModule** - Positions route visualizations below labels for readability:
 * ```typescript
 * // Routes appear below labels but above the base map
 * const routingModule = await RoutingModule.get(map);
 * // Uses mapStyleLayerIDs.lowestLabel by default
 * ```
 *
 * **GeometriesModule** - Configurable layer positioning for polygon areas:
 * ```typescript
 * // Default: below labels
 * const geometriesModule = await GeometriesModule.get(map);
 *
 * // Custom: below buildings to show at ground level
 * const geometriesModule = await GeometriesModule.get(map, {
 *   beforeLayerConfig: 'lowestBuilding'
 * });
 *
 * // On top of everything
 * const geometriesModule = await GeometriesModule.get(map, {
 *   beforeLayerConfig: 'top'
 * });
 * ```
 *
 * **Custom Layer Implementation:**
 * ```typescript
 * // Add a highlight layer below labels
 * map.addLayer({
 *   id: 'search-results',
 *   type: 'fill',
 *   source: 'results-source',
 *   paint: { 'fill-color': '#ffcc00', 'fill-opacity': 0.4 }
 * }, mapStyleLayerIDs.lowestLabel);
 * ```
 *
 * **Style Persistence:**
 *
 * These layer IDs remain consistent across TomTom map style changes (e.g., switching from
 * 'standardLight' to 'standardDark'). The SDK automatically repositions module layers using
 * the corresponding reference layers in the new style, maintaining the intended visual hierarchy.
 *
 * **Important Notes:**
 * - `lowestBuilding` is not available in the Satellite style
 * - If a reference layer doesn't exist, custom layers will be added on top of the style
 * - Both RoutingModule and GeometriesModule default to `lowestLabel` for optimal visibility
 *
 * @see {@link GeometryBeforeLayerConfig} for GeometriesModule layer positioning options
 * @see {@link RouteLayersConfig} for RoutingModule layer configuration
 *
 * @group Map Style
 */
export const mapStyleLayerIDs = {
    /**
     * Country name label layer.
     *
     * @remarks
     * Lower in the stack than most labels. Use to position elements below country
     * labels but above other map features.
     */
    country: 'Places - Country name',
    /**
     * The lowest layer for place labels.
     *
     * @remarks
     * Lower in the stack than city labels. Use to position content below all place
     * name labels while keeping it visible above geographic features.
     */
    lowestPlaceLabel: 'Places - Village / Hamlet',
    /**
     * Points of Interest layer.
     *
     * @remarks
     * Use to position custom content in the layer stack relative to POI icons and labels.
     */
    poi: 'POI',
    /**
     * The lowest labels layer in the stack.
     *
     * @remarks
     * **Most commonly used reference layer.** Positioning layers before this ensures
     * content appears below all text labels, maintaining map readability while keeping
     * visualizations prominent.
     *
     * **Default for SDK modules:**
     * - RoutingModule uses this for route lines and waypoints
     * - GeometriesModule uses this as the default for polygon fills and borders
     *
     * This provides optimal balance between visibility and not obscuring map labels.
     */
    lowestLabel: 'Borders - Treaty label',
    /**
     * The lowest road line layer in the stack.
     *
     * @remarks
     * Represents tunnel railway outlines. Use to position content below the road network,
     * useful for showing base layers or features that should appear beneath transportation
     * infrastructure.
     */
    lowestRoadLine: 'Tunnel - Railway outline',
    /**
     * The lowest building layer in the stack.
     *
     * @remarks
     * Use to position content below 3D building extrusions while keeping it above
     * flat map features like roads and terrain.
     *
     * **Note:** Not available in the Satellite style.
     */
    lowestBuilding: 'Buildings - Underground',
} as const;
