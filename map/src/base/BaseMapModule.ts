import { isNil, mapValues } from 'lodash-es';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import {
    AbstractStyleOwnedMapModule,
    BASE_MAP_SOURCE_ID,
    type CombinedEvents,
    type ResolvedEventScope,
    StyleSourceWithLayers,
    sharedInstance,
} from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { waitUntilMapIsReady } from '../shared/mapUtils';
import { TomTomMap } from '../TomTomMap';
import { baseMapLayerFilter, buildLayerGroupFilter, groupBaseMapLayers } from './layerGroups';
import type { BaseMapLayerGroupName, BaseMapLayerGroups, BaseMapModuleConfig } from './types/baseMapModuleConfig';

type BaseSourceAndLayers = {
    vectorTiles: StyleSourceWithLayers;
};

/**
 * Scope accepted by `baseMap.events.where(...)`, in addition to a plain feature predicate.
 *
 * `layerGroups` narrows to part of the map — road labels, water, buildings — using the same
 * {@link BaseMapLayerGroupName} vocabulary as `setVisible`. `features` narrows within those
 * layers, and the two combine.
 *
 * @example
 * ```typescript
 * baseMap.events
 *     .where({ layerGroups: { mode: 'include', names: ['roadLabels', 'roadShields'] } },
 *            { cursorOnHover: 'pointer' })
 *     .on('click', (feature) => showRoadName(feature.properties.name));
 * ```
 *
 * @group Base Map
 */
export type BaseMapEventScope = {
    /** Which layer groups this scope covers. */
    layerGroups: BaseMapLayerGroups;
    /** Optional further narrowing to particular features within those layers. */
    features?: (feature: MapGeoJSONFeature) => boolean;
};

/**
 * Event surface of {@link BaseMapModule}. The base map manages one source, so it has no named
 * scopes — `events` is that scope, narrowed on demand with `where()`.
 *
 * @group Base Map
 */
export type BaseMapEvents = CombinedEvents<MapGeoJSONFeature, BaseMapModuleConfig, never, BaseMapEventScope>;

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
 * const baseMap = await BaseMapModule.get(map);
 *
 * // Hide buildings and labels
 * baseMap.setVisible(false, {
 *   layerGroups: {
 *     mode: 'include',
 *     names: ['buildings2D', 'buildings3D', 'allPlaceLabels']
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
 * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/styles)
 *
 * @group Base Map
 */
export class BaseMapModule extends AbstractStyleOwnedMapModule<BaseSourceAndLayers, BaseMapModuleConfig> {
    // Layer ids per group for the managed layers, computed lazily from the current
    // style and reset whenever the module (re)initializes its sources.
    private layersByGroup?: Record<BaseMapLayerGroupName, string[]>;

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
     * **Instances:**
     * `BaseMapModule` controls the base-map source and layers the map style already provides, under
     * fixed global IDs, so every map has exactly one — a second `get()` returns the same instance.
     * To work with part of the map, name the layer groups per call: `setVisible(false, {
     * layerGroups })` for visibility, `events.where({ layerGroups })` for events.
     *
     * **Initialization:**
     * - Waits for map to be ready before creating module
     * - Validates that required sources exist in the map style
     * - Applies initial configuration if provided
     *
     * **Configuration Options:**
     * - `visible`: Initial visibility state
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
     *   layerGroupsVisibility: {
     *     mode: 'include',
     *     names: ['buildings3D', 'houseNumbers'],
     *     visible: false
     *   }
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: BaseMapModuleConfig): Promise<BaseMapModule> {
        await waitUntilMapIsReady(tomtomMap);
        return sharedInstance(
            tomtomMap,
            BaseMapModule,
            () => new BaseMapModule(tomtomMap, config),
            config && ((existing) => existing.applyConfig(config)),
        );
    }

    private constructor(map: TomTomMap, config?: BaseMapModuleConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const source = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${BASE_MAP_SOURCE_ID}`);
        }

        const vectorTiles = new StyleSourceWithLayers(this.mapLibreMap, source, baseMapLayerFilter);

        // The managed layer set is (re)built here — on init and on every style
        // change — so the group index always tracks the current style. Reset the
        // lazily-computed group index so it recomputes on next access.
        this.layersByGroup = undefined;

        return { vectorTiles };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: BaseMapModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this._setVisible(config.visible, undefined, false);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this._setVisible(true, undefined, false);
        }

        if (config?.layerGroupsVisibility) {
            this._setVisible(
                config.layerGroupsVisibility.visible,
                { layerGroups: config.layerGroupsVisibility },
                false,
            );
        }

        // We merge the given config with the previous one to ensure init config parameters are kept:
        // (the init config can have more parameters than the runtime one)
        return this.config || config ? { ...this.config, ...config } : undefined;
    }

    /**
     * Checks if any base map layers are currently visible.
     *
     * @param options - Optional settings for fine-grained control.
     * @param options.layerGroups - Ask about specific layer groups instead of all layers.
     *
     * @returns `true` if at least one of the layers asked about is visible, `false` if all are
     * hidden.
     *
     * @remarks
     * This checks the actual visibility state of layers in the map, not just the
     * module's configuration setting.
     *
     * Mirrors {@link setVisible}, so a group toggled through one can be read back through the
     * other — which is how a per-group control reflects the state the style actually starts in.
     *
     * @example
     * ```typescript
     * if (baseMap.isVisible()) {
     *   console.log('Base map is rendered');
     * } else {
     *   console.log('Base map is hidden');
     * }
     * ```
     *
     * @example
     * Ask about one group:
     * ```typescript
     * // buildings3D ships hidden in most styles
     * const shown = baseMap.isVisible({ layerGroups: { mode: 'include', names: ['buildings3D'] } });
     * ```
     */
    isVisible(options?: { layerGroups?: BaseMapLayerGroups }): boolean {
        return this.sourcesWithLayers.vectorTiles.isAnyLayerVisible(
            options?.layerGroups && buildLayerGroupFilter(options.layerGroups),
        );
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
     * Available groups: `land`, `water`, `buildings2D`, `roads`, `railways`,
     * `ferries`, `borders`, `buildings3D`, `natureLabels`, `roadLabels`,
     * `roadShields`, `houseNumbers`, `smallerTownLabels`, `stateLabels`,
     * `cityLabels`, `allPlaceLabels`, `capitalLabels`, `countryLabels`.
     * See {@link BaseMapLayerGroupName}.
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
     *     names: ['allPlaceLabels', 'cityLabels', 'countryLabels']
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
        this._setVisible(visible, options);
    }

    private _setVisible(visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }, updateConfig = true): void {
        if (updateConfig) {
            if (!options?.layerGroups) {
                // We remove the layer groups visibility from the config if it was there:
                delete this.config?.layerGroupsVisibility;
                this.config = { ...this.config, visible };
            } else {
                this.config = { ...this.config, layerGroupsVisibility: { ...options.layerGroups, visible } };
            }
        }

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.vectorTiles.setLayersVisible(
                visible,
                options?.layerGroups && buildLayerGroupFilter(options.layerGroups),
            );
        }

        if (updateConfig) {
            this.emitConfigChange();
        }
    }

    /**
     * The base-map layer ids grouped by {@link BaseMapLayerGroupName}, for the
     * layers this module manages in the current style.
     *
     * @returns A record with an entry for every layer group (empty array when the
     * style has no layers for it). Layer ids keep their style draw order within
     * each group. Groups overlap by design (e.g. a city label is in both
     * `cityLabels` and `allPlaceLabels`), so a layer id can appear under several.
     *
     * @remarks
     * Computed lazily on first access and cached until the module reinitializes
     * (e.g. after a style change), so it always reflects the current style. The
     * returned record and its arrays are copies — mutate them freely, it won't
     * affect the module or a later call.
     *
     * @example
     * ```typescript
     * const layers = baseMap.getLayers();
     * console.log(layers.water);   // ['Water - Fill', 'Water - Line', …]
     * console.log(layers.roads);   // road line + surface-area layer ids
     * ```
     */
    getLayers(): Record<BaseMapLayerGroupName, string[]> {
        return mapValues(this.groupedLayers(), (layerIds) => [...layerIds]);
    }

    /**
     * The managed layer ids belonging to a single base-map layer group.
     *
     * @param group - The layer group to look up.
     * @returns The layer ids for that group, in style draw order (empty when none).
     * A fresh array each call, safe to mutate.
     *
     * @example
     * ```typescript
     * baseMap.getLayerIds('buildings3D'); // ['3D - Building', …]
     * ```
     */
    getLayerIds(group: BaseMapLayerGroupName): string[] {
        return [...this.groupedLayers()[group]];
    }

    // The group index for the current style, classified on first access. Callers never see this
    // record: getLayers/getLayerIds copy it, so a consumer mutating what they got back — an
    // in-place sort of the ids, say — cannot corrupt the index for the rest of the style's life.
    private groupedLayers(): Record<BaseMapLayerGroupName, string[]> {
        this.layersByGroup ??= groupBaseMapLayers(this.sourcesWithLayers.vectorTiles._layerSpecs);
        return this.layersByGroup;
    }

    /**
     * Gets the unified events interface for this module, covering both user interactions
     * and module lifecycle events.
     *
     * **User interaction events** (`click`, `contextmenu`, `hover`, `long-hover`):
     * ```typescript
     * const unsub = baseMap.events.on('click', (feature, lngLat) => {
     *   console.log('Clicked on:', feature.properties);
     * });
     * baseMap.events.off('hover'); // remove by type
     * ```
     *
     * **Module lifecycle events** (`config-change`):
     * ```typescript
     * const unsub = baseMap.events.on('config-change', (config) => {
     *   console.log('Config changed:', config);
     * });
     * unsub(); // remove by returned function
     * ```
     */
    get events(): BaseMapEvents {
        return this.moduleEvents<MapGeoJSONFeature, BaseMapEventScope>(['vectorTiles'], {
            scopeResolver: resolveBaseMapEventScope,
        });
    }
}

// The base map is the only module whose single source carries layers a caller can name: the
// style's `metadata.group` taxonomy, surfaced as BaseMapLayerGroupName. Everywhere else a layer
// subset is a rendering detail (casing vs line vs label), so scoping there is by feature instead.
const resolveBaseMapEventScope = (scope: BaseMapEventScope): ResolvedEventScope => ({
    layerFilter: buildLayerGroupFilter(scope.layerGroups),
    featureMatches: scope.features,
});
