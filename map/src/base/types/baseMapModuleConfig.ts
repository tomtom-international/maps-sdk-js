import type { MapModuleCommonConfig } from '../../shared';

/**
 * Available base map layer group identifiers.
 *
 * @remarks
 * Use these names with {@link BaseMapModule} to control layer visibility.
 *
 * Ordered by z-order in the TomTom base-map style, from the layers painted
 * lowest (underneath) to highest (on top). The place-label order mirrors the
 * style's own draw order rather than the settlement hierarchy.
 *
 * @see {@link BaseMapLayerGroupName}
 *
 * @group Base Map
 */
export const baseMapLayerGroupNames = [
    'land',
    'water',
    'buildings2D',
    'roads',
    'railways',
    'ferries',
    'borders',
    'buildings3D',
    'natureLabels',
    'roadLabels',
    'roadShields',
    'houseNumbers',
    'smallerTownLabels',
    'stateLabels',
    'cityLabels',
    'allPlaceLabels',
    'capitalLabels',
    'countryLabels',
] as const;

/**
 * Name of a base map layer group.
 *
 * Identifies specific categories of base map layers that can be controlled together.
 *
 * @remarks
 * Layers are classified by the style's `metadata.group`, so these groups track
 * the TomTom base-map style rather than any layer id naming.
 *
 * **Surfaces & nature:**
 * - `land` - Land use & land cover areas (and the map background)
 * - `water` - Water bodies (oceans, lakes, rivers)
 * - `natureLabels` - Natural feature labels (peaks, islands, rivers, water areas)
 *
 * **Transport geometry:**
 * - `roads` - Road lines (motorway…street, service, paths, tracks), their arrows,
 *   and road/transit surface areas (pedestrian areas, runways, platforms, piers)
 * - `railways` - Railways (rail, light rail, subway, tram) and aerial cableways
 * - `ferries` - Ferry connections
 *
 * **Buildings:**
 * - `buildings2D` - 2D building footprints
 * - `buildings3D` - 3D building models
 *
 * **Boundaries:**
 * - `borders` - Administrative boundaries, overlays (military/protected) and their labels
 *
 * **Text:**
 * - `roadLabels` - Road name labels
 * - `roadShields` - Highway shields (e.g., I-95, A1)
 * - `houseNumbers` - House number labels
 *
 * **Place labels:**
 * - `allPlaceLabels` - All place labels (superset of the settlement/admin groups below)
 * - `smallerTownLabels` - Neighbourhood, village, hamlet & town labels
 * - `cityLabels` - City labels
 * - `capitalLabels` - Capital city labels
 * - `stateLabels` - State/province labels
 * - `countryLabels` - Country name labels
 *
 * @example
 * ```typescript
 * const group: BaseMapLayerGroupName = 'roads';
 * const labels: BaseMapLayerGroupName[] = ['cityLabels', 'countryLabels'];
 * ```
 *
 * @group Base Map
 */
export type BaseMapLayerGroupName = (typeof baseMapLayerGroupNames)[number];

/**
 * Layer group visibility configuration with explicit visible state.
 *
 * Extends {@link BaseMapLayerGroups} to include a visibility flag, allowing
 * you to show or hide specific groups of base map layers.
 *
 * @example
 * ```typescript
 * // Hide all buildings
 * const config: BaseMapLayerGroupsVisibility = {
 *   mode: 'include',
 *   names: ['buildings2D', 'buildings3D'],
 *   visible: false
 * };
 *
 * // Show only roads
 * const roadsOnly: BaseMapLayerGroupsVisibility = {
 *   mode: 'include',
 *   names: ['roads', 'roadLabels'],
 *   visible: true
 * };
 * ```
 *
 * @group Base Map
 */
export type BaseMapLayerGroupsVisibility = BaseMapLayerGroups & { visible: boolean };

/**
 * Layer group filter for selective base map display.
 *
 * Defines which layer groups to include or exclude from the base map module.
 * Can be expressed as explicit inclusions (show only these) or exclusions
 * (show all except these).
 *
 * @remarks
 * **Filter Modes:**
 * - `include`: Only the specified groups are shown, all others are hidden
 * - `exclude`: All groups are shown except the specified ones
 *
 * **Common Use Cases:**
 * - Show only roads and labels (minimal map)
 * - Hide buildings for cleaner appearance
 * - Show only water and land (base terrain)
 * - Remove labels for overlay maps
 *
 * @example
 * ```typescript
 * // Show only roads and borders
 * const roadsOnly: BaseMapLayerGroups = {
 *   mode: 'include',
 *   names: ['roads', 'roadLabels', 'borders']
 * };
 *
 * // Show everything except buildings
 * const noBuildings: BaseMapLayerGroups = {
 *   mode: 'exclude',
 *   names: ['buildings2D', 'buildings3D']
 * };
 *
 * // Show only terrain (no labels, no roads)
 * const terrainOnly: BaseMapLayerGroups = {
 *   mode: 'include',
 *   names: ['land', 'water']
 * };
 * ```
 *
 * @group Base Map
 */
export type BaseMapLayerGroups = {
    /**
     * Filter mode determining whether groups are included or excluded.
     *
     * @remarks
     * - `include`: Only the specified groups are considered, all others are ignored
     * - `exclude`: All base map groups except the specified ones are considered
     *
     * @example
     * ```typescript
     * mode: 'include'  // Whitelist approach
     * mode: 'exclude'  // Blacklist approach
     * ```
     */
    mode: 'include' | 'exclude';

    /**
     * Names of the layer groups to include or exclude.
     *
     * @remarks
     * The meaning depends on the `mode`:
     * - In `include` mode: Only these groups will be shown
     * - In `exclude` mode: These groups will be hidden, all others shown
     *
     * @example
     * ```typescript
     * // Show only these
     * names: ['roads', 'roadLabels', 'water']
     *
     * // Hide these
     * names: ['buildings2D', 'buildings3D', 'houseNumbers']
     * ```
     */
    names: BaseMapLayerGroupName[];
};

/**
 * Configuration for the BaseMapModule (initialization or runtime).
 *
 * Controls visibility and behavior of base map layer groups. Can be used both
 * during module initialization and for runtime updates.
 *
 * @remarks
 * This configuration allows fine-grained control over which base map elements
 * are displayed, enabling you to create custom map appearances for different
 * use cases.
 *
 * @example
 * ```typescript
 * // Hide specific layer groups
 * const config: BaseMapModuleConfig = {
 *   layerGroupsVisibility: {
 *     mode: 'include',
 *     names: ['buildings2D', 'buildings3D'],
 *     visible: false
 *   }
 * };
 *
 * // Show only certain groups
 * const minimalConfig: BaseMapModuleConfig = {
 *   visible: true,
 *   layerGroupsVisibility: {
 *     mode: 'include',
 *     names: ['roads', 'water', 'land'],
 *     visible: true
 *   }
 * };
 * ```
 *
 * @group Base Map
 */
export type BaseMapModuleConfig = MapModuleCommonConfig & {
    /**
     * Controls the visibility of all layers associated with this module.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Optional visibility configuration for specific layer groups.
     *
     * @remarks
     * Use this to control visibility of layer groups at runtime without
     * reinitializing the module.
     *
     * @example
     * ```typescript
     * // Hide all building layers
     * layerGroupsVisibility: {
     *   mode: 'include',
     *   names: ['buildings2D', 'buildings3D'],
     *   visible: false
     * }
     *
     * // Show only labels
     * layerGroupsVisibility: {
     *   mode: 'include',
     *   names: ['allPlaceLabels', 'cityLabels', 'countryLabels'],
     *   visible: true
     * }
     * ```
     */
    layerGroupsVisibility?: BaseMapLayerGroupsVisibility;
};
