import { isNil } from 'lodash-es';

import { AbstractMapModule, BASE_MAP_SOURCE_ID, EventsModule, StyleSourceWithLayers } from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import { TomTomMap } from '../TomTomMap';
import { buildBaseMapLayerGroupFilter, buildLayerGroupFilter } from './layerGroups';
import type { BaseMapLayerGroups, BaseMapModuleConfig, BaseMapModuleInitConfig } from './types/baseMapModuleConfig';

type BaseSourceAndLayers = {
    vectorTiles: StyleSourceWithLayers;
};

/**
 * Base Map Module for controlling standard map layers and their visibility.
 *
 * This module manages the fundamental map layers including background, water, land, roads,
 * buildings, labels, and other vector tile layers from the base map style.
 *
 * @remarks
 * **Managed Layers:**
 * - Background and terrain
 * - Water bodies and coastlines
 * - Country and administrative borders
 * - Buildings (2D and 3D)
 * - Road lines, labels, and shields
 * - Place labels at various zoom levels
 * - House numbers
 *
 * **Does NOT Include:**
 * - Traffic flow/incidents (use {@link TrafficFlowModule} or {@link TrafficIncidentsModule})
 * - Points of Interest/POIs (use {@link POIsModule})
 * - Hillshade/terrain shading (use {@link HillshadeModule})
 *
 * **Use Cases:**
 * - Toggle base map visibility on/off
 * - Show only specific layer groups (e.g., roads only)
 * - Create custom map appearances by hiding certain elements
 * - Build overlay maps with selective base layers
 *
 * @example
 * Basic usage:
 * ```typescript
 * // Get module with default configuration
 * const baseMap = await BaseMapModule.get(map);
 *
 * // Toggle visibility
 * baseMap.setVisible(false); // Hide all base layers
 * baseMap.setVisible(true);  // Show all base layers
 *
 * // Check current state
 * if (baseMap.isVisible()) {
 *   console.log('Base map is visible');
 * }
 * ```
 *
 * @example
 * Working with layer groups:
 * ```typescript
 * // Show only roads and borders
 * const baseMap = await BaseMapModule.get(map, {
 *   layerGroupsFilter: {
 *     mode: 'include',
 *     names: ['roadLines', 'roadLabels', 'borders']
 *   }
 * });
 *
 * // Hide buildings and labels
 * baseMap.setVisible(false, {
 *   layerGroups: {
 *     mode: 'include',
 *     names: ['buildings2D', 'buildings3D', 'placeLabels']
 *   }
 * });
 *
 * // Show only water and land
 * baseMap.setVisible(true, {
 *   layerGroups: {
 *     mode: 'include',
 *     names: ['water', 'land']
 *   }
 * });
 * ```
 *
 * @example
 * Event handling:
 * ```typescript
 * const baseMap = await BaseMapModule.get(map);
 *
 * // Listen for clicks on base map features
 * baseMap.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked base map feature:', feature);
 * });
 *
 * // Remove event listeners
 * baseMap.events.off('click');
 * ```
 *
 * @see [Base Map Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/base-map)
 * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/map-styles)
 *
 * @group Base Map
 */
export class BaseMapModule extends AbstractMapModule<BaseSourceAndLayers, BaseMapModuleConfig> {
    /**
     * Asynchronously retrieves a BaseMapModule instance for the given map.
     *
     * This is the recommended way to create a BaseMapModule. It ensures the map
     * is fully loaded before initializing the module.
     *
     * @param tomtomMap - The TomTomMap instance to attach this module to.
     * @param config - Optional configuration for module initialization.
     *
     * @returns A promise that resolves to the initialized BaseMapModule.
     *
     * @remarks
     * **Initialization:**
     * - Waits for map to be ready before creating module
     * - Validates that required sources exist in the map style
     * - Applies initial configuration if provided
     *
     * **Configuration Options:**
     * - `visible`: Initial visibility state
     * - `layerGroupsFilter`: Which layer groups to include/exclude
     * - `layerGroupsVisibility`: Fine-grained visibility per group
     *
     * @throws Error if the base map source is not found in the style
     *
     * @example
     * Default initialization:
     * ```typescript
     * const baseMap = await BaseMapModule.get(map);
     * ```
     *
     * @example
     * With configuration:
     * ```typescript
     * const baseMap = await BaseMapModule.get(map, {
     *   visible: true,
     *   layerGroupsFilter: {
     *     mode: 'exclude',
     *     names: ['buildings3D', 'houseNumbers']
     *   }
     * });
     * ```
     *
     * @example
     * Show only specific groups:
     * ```typescript
     * const baseMap = await BaseMapModule.get(map, {
     *   layerGroupsFilter: {
     *     mode: 'include',
     *     names: ['water', 'land', 'borders']
     *   },
     *   visible: true
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: BaseMapModuleInitConfig): Promise<BaseMapModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new BaseMapModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: BaseMapModuleConfig) {
        super('style', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config: BaseMapModuleInitConfig | undefined) {
        const source = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${BASE_MAP_SOURCE_ID}`);
        }

        return {
            vectorTiles: new StyleSourceWithLayers(
                this.mapLibreMap,
                source,
                buildBaseMapLayerGroupFilter(config?.layerGroupsFilter),
            ),
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: BaseMapModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        if (config?.layerGroupsVisibility) {
            this.setVisible(config.layerGroupsVisibility.visible, { layerGroups: config.layerGroupsVisibility });
        }

        // We merge the given config with the previous one to ensure init config parameters are kept:
        // (the init config can have more parameters than the runtime one)
        return { ...this.config, ...config };
    }

    /**
     * Checks if any base map layers are currently visible.
     *
     * @returns `true` if at least one base map layer is visible, `false` if all are hidden.
     *
     * @remarks
     * This checks the actual visibility state of layers in the map, not just the
     * module's configuration setting.
     *
     * @example
     * ```typescript
     * if (baseMap.isVisible()) {
     *   console.log('Base map is rendered');
     * } else {
     *   console.log('Base map is hidden');
     * }
     * ```
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.vectorTiles.isAnyLayerVisible();
    }

    /**
     * Sets the visibility of base map layers.
     *
     * @param visible - `true` to show layers, `false` to hide them.
     * @param options - Optional settings for fine-grained control.
     * @param options.layerGroups - Target specific layer groups instead of all layers.
     *
     * @remarks
     * **Behavior:**
     * - Without `options.layerGroups`: Affects all base map layers
     * - With `options.layerGroups`: Affects only specified layer groups
     * - Changes are applied immediately if map is ready
     *
     * **Layer Groups:**
     * Available groups: `land`, `water`, `borders`, `buildings2D`, `buildings3D`,
     * `houseNumbers`, `roadLines`, `roadLabels`, `roadShields`, `placeLabels`,
     * `smallerTownLabels`, `cityLabels`, `capitalLabels`, `stateLabels`, `countryLabels`
     *
     * @example
     * Show/hide all layers:
     * ```typescript
     * baseMap.setVisible(false); // Hide everything
     * baseMap.setVisible(true);  // Show everything
     * ```
     *
     * @example
     * Control specific groups:
     * ```typescript
     * // Hide only buildings
     * baseMap.setVisible(false, {
     *   layerGroups: {
     *     mode: 'include',
     *     names: ['buildings2D', 'buildings3D']
     *   }
     * });
     *
     * // Show everything except labels
     * baseMap.setVisible(true, {
     *   layerGroups: {
     *     mode: 'exclude',
     *     names: ['placeLabels', 'cityLabels', 'countryLabels']
     *   }
     * });
     * ```
     *
     * @example
     * Toggle visibility:
     * ```typescript
     * const isVisible = baseMap.isVisible();
     * baseMap.setVisible(!isVisible); // Toggle
     * ```
     */
    setVisible(visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }): void {
        if (!options?.layerGroups) {
            // We remove the layer groups visibility from the config if it was there:
            delete this.config?.layerGroupsVisibility;
            this.config = { ...this.config, visible };
        } else {
            this.config = { ...this.config, layerGroupsVisibility: { ...options.layerGroups, visible } };
        }

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.vectorTiles.setLayersVisible(
                visible,
                options?.layerGroups && buildLayerGroupFilter(options.layerGroups),
            );
        }
    }

    /**
     * Gets the events interface for this module to handle user interactions.
     *
     * @returns An EventsModule instance for registering event handlers.
     *
     * @remarks
     * **Supported Events:**
     * - `click`: User clicks on a base map feature
     * - `contextmenu`: User right-clicks on a feature
     * - `hover`: Mouse enters a feature
     * - `long-hover`: Mouse hovers over a feature for extended time
     *
     * **Event Handler Signature:**
     * ```typescript
     * (feature: MapGeoJSONFeature, lngLat: LngLat, allFeatures: MapGeoJSONFeature[]) => void
     * ```
     *
     * @example
     * Register click handler:
     * ```typescript
     * baseMap.events.on('click', (feature, lngLat) => {
     *   console.log('Clicked on:', feature.properties);
     *   console.log('At coordinates:', lngLat);
     * });
     * ```
     *
     * @example
     * Multiple event types:
     * ```typescript
     * // Show tooltip on hover
     * baseMap.events.on('hover', (feature) => {
     *   showTooltip(feature.properties.name);
     * });
     *
     * // Handle clicks
     * baseMap.events.on('click', (feature) => {
     *   selectFeature(feature.id);
     * });
     *
     * // Clean up
     * baseMap.events.off('hover');
     * baseMap.events.off('click');
     * ```
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.vectorTiles);
    }
}
