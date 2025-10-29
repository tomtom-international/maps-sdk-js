import type { StyleModuleConfig } from '../../shared';

/**
 * Available base map layer group identifiers.
 *
 * @remarks
 * Use these names with {@link BaseMapModule} to control layer visibility.
 *
 * @see {@link BaseMapLayerGroupName}
 * @see {@link BaseMapModuleInitConfig.layerGroupsFilter}
 *
 * @group Base Map
 */
export const baseMapLayerGroupNames = [
    'land',
    'water',
    'borders',
    'buildings2D',
    'buildings3D',
    'houseNumbers',
    'roadLines',
    'roadLabels',
    'roadShields',
    'placeLabels',
    'smallerTownLabels',
    'cityLabels',
    'capitalLabels',
    'stateLabels',
    'countryLabels',
] as const;

/**
 * Name of a base map layer group.
 *
 * Identifies specific categories of base map layers that can be controlled together.
 *
 * @remarks
 * **Available Layer Groups:**
 * - `land` - Land areas and terrain
 * - `water` - Water bodies (oceans, lakes, rivers)
 * - `borders` - Country and administrative boundaries
 * - `buildings2D` - 2D building footprints
 * - `buildings3D` - 3D building models
 * - `houseNumbers` - House number labels
 * - `roadLines` - Road line geometries
 * - `roadLabels` - Street name labels
 * - `roadShields` - Highway shields (e.g., I-95, A1)
 * - `placeLabels` - General place labels
 * - `smallerTownLabels` - Small town/village labels
 * - `cityLabels` - City labels
 * - `capitalLabels` - Capital city labels
 * - `stateLabels` - State/province labels
 * - `countryLabels` - Country name labels
 *
 * @example
 * ```typescript
 * const group: BaseMapLayerGroupName = 'roadLines';
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
 *   names: ['roadLines', 'roadLabels'],
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
 *   names: ['roadLines', 'roadLabels', 'borders']
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
     * names: ['roadLines', 'roadLabels', 'water']
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
 *     names: ['roadLines', 'water', 'land'],
 *     visible: true
 *   }
 * };
 * ```
 *
 * @group Base Map
 */
export type BaseMapModuleConfig = StyleModuleConfig & {
    /**
     * Optional visibility configuration for specific layer groups.
     *
     * @remarks
     * **Important:** The layer groups specified here must be included in the
     * module (not excluded by `layerGroupsFilter` during initialization).
     *
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
     *   names: ['placeLabels', 'cityLabels', 'countryLabels'],
     *   visible: true
     * }
     * ```
     */
    layerGroupsVisibility?: BaseMapLayerGroupsVisibility;
};

/**
 * Initialization configuration for the BaseMapModule.
 *
 * Extends {@link BaseMapModuleConfig} with additional options available only
 * during module initialization.
 *
 * @remarks
 * **Initialization vs Runtime:**
 * - `layerGroupsFilter`: Only available at init - determines which groups to load
 * - `layerGroupsVisibility`: Available at init and runtime - controls visibility
 *
 * **Use Cases:**
 * - Create minimal maps with only essential layers
 * - Build custom map styles by excluding certain features
 * - Optimize performance by not loading unnecessary layers
 *
 * @example
 * ```typescript
 * // Initialize with only roads and water
 * const initConfig: BaseMapModuleInitConfig = {
 *   layerGroupsFilter: {
 *     mode: 'include',
 *     names: ['roadLines', 'roadLabels', 'water', 'land']
 *   },
 *   visible: true
 * };
 *
 * // Exclude buildings from initialization
 * const noBuildingsConfig: BaseMapModuleInitConfig = {
 *   layerGroupsFilter: {
 *     mode: 'exclude',
 *     names: ['buildings2D', 'buildings3D', 'houseNumbers']
 *   }
 * };
 *
 * // Minimal map for data overlay
 * const overlayBaseConfig: BaseMapModuleInitConfig = {
 *   layerGroupsFilter: {
 *     mode: 'include',
 *     names: ['water', 'land', 'borders']
 *   },
 *   visible: true
 * };
 * ```
 *
 * @group Base Map
 */
export type BaseMapModuleInitConfig = BaseMapModuleConfig & {
    /**
     * Layer groups to include/exclude during module initialization.
     *
     * @remarks
     * **One-time configuration:** This can only be set during initialization.
     * Once the module is created, you cannot change which groups are loaded,
     * only their visibility via `layerGroupsVisibility`.
     *
     * @example
     * ```typescript
     * // Load only essential layers
     * layerGroupsFilter: {
     *   mode: 'include',
     *   names: ['land', 'water', 'roadLines', 'borders']
     * }
     *
     * // Load everything except 3D buildings
     * layerGroupsFilter: {
     *   mode: 'exclude',
     *   names: ['buildings3D']
     * }
     *
     * // Minimal overlay map
     * layerGroupsFilter: {
     *   mode: 'include',
     *   names: ['water', 'land']
     * }
     * ```
     */
    layerGroupsFilter?: BaseMapLayerGroups;
};
