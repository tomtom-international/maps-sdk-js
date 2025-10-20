import type { Map } from 'maplibre-gl';
import type { TomTomMap } from '../TomTomMap';
import type { EventsProxy } from './EventsProxy';
import { waitUntilMapIsReady } from './mapUtils';
import type { SourcesWithLayers, SourceWithLayerIDs } from './types';
import type { MapModuleSource } from './types/mapModule';

/**
 * Base class for all Maps SDK map modules.
 *
 * This abstract class provides the foundation for creating map modules that can display
 * and manage various types of data on a TomTom map. It handles module lifecycle management,
 * including initialization, configuration updates, and automatic restoration after map style changes.
 *
 * @remarks
 * All map modules extend this class to ensure consistent behavior across the SDK.
 * The class manages the module's sources, layers, and configuration, automatically
 * handling map style changes by restoring the module's state when needed.
 *
 * @typeParam SOURCES_WITH_LAYERS - The type defining the sources and layers used by this module
 * @typeParam CFG - The configuration type for this module, or undefined if no configuration is needed
 *
 * @example
 * ```typescript
 * class CustomModule extends AbstractMapModule<MySourcesWithLayers, MyConfig> {
 *   constructor(tomtomMap: TomTomMap, config?: MyConfig) {
 *     super('geojson', tomtomMap, config);
 *   }
 *   // Implement abstract methods...
 * }
 * ```
 */
export abstract class AbstractMapModule<SOURCES_WITH_LAYERS extends SourcesWithLayers, CFG = undefined> {
    private readonly sourceType: MapModuleSource;
    /**
     * @ignore
     */
    protected readonly tomtomMap: TomTomMap;
    /**
     * @ignore
     */
    protected readonly eventsProxy: EventsProxy;
    /**
     * @ignore
     */
    protected readonly mapLibreMap: Map;
    /**
     * @ignore
     */
    protected sourcesWithLayers!: SOURCES_WITH_LAYERS;
    /**
     * @ignore
     */
    protected _sourceAndLayerIDs!: Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
    /**
     * @ignore
     */
    protected config?: CFG;
    /**
     * @ignore
     */
    protected _initializing = true;

    /**
     * Indicates that this module is currently adding its sources and layers to the map, so during this time it might not function properly.
     * @see waitUntilModuleReady
     * @private
     */
    private moduleReady = false;

    /**
     * Builds this module based on a given Maps SDK map.
     * @param tomtomMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param sourceType Whether the module is based on a map style or on added GeoJSON data.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(sourceType: MapModuleSource, tomtomMap: TomTomMap, config?: CFG) {
        this.sourceType = sourceType;
        this.tomtomMap = tomtomMap;
        this.eventsProxy = tomtomMap._eventsProxy;
        this.tomtomMap.addStyleChangeHandler({
            onStyleAboutToChange: () => {
                this.moduleReady = false;
            },
            onStyleChanged: () => this.restoreDataAndConfig(),
        });
        this.mapLibreMap = tomtomMap.mapLibreMap;
        this.initSourcesWithLayers(config);
        if (config) {
            this.applyConfig(config);
        }
        this._initializing = false;
    }

    /**
     * Initializes the sources with layers of this module.
     * @param config The optional configuration for the module.
     * @param restore Whether we are restoring an existing module after the map style got reloaded.
     * @protected
     * @ignore
     */
    protected initSourcesWithLayers(config?: CFG, restore?: boolean): void {
        this.moduleReady = false;
        this.sourcesWithLayers = this._initSourcesWithLayers(config, restore);
        this._sourceAndLayerIDs = Object.fromEntries(
            Object.entries(this.sourcesWithLayers).map(([name, sourceWithLayers]) => [
                name,
                sourceWithLayers.sourceAndLayerIDs,
            ]),
        ) as Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
        if (restore) {
            this.eventsProxy.updateIfRegistered(this.sourcesWithLayers);
        }
        // Only if the map is still ready, we consider that the module is ready.
        // Otherwise, we assume there's a quick style change in progress and expect that'll trigger the module to restore itself again.
        if (this.tomtomMap.mapReady) {
            this.moduleReady = true;
        }
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     * @ignore
     */
    protected abstract _initSourcesWithLayers(config?: CFG, restore?: boolean): SOURCES_WITH_LAYERS;

    protected async waitUntilModuleReady(): Promise<void> {
        await waitUntilMapIsReady(this.tomtomMap);
        if (!this.moduleReady) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (this.tomtomMap.mapReady && this.moduleReady) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 200);
            });
        }
    }

    /**
     * Applies a configuration to this module.
     *
     * This method updates the module's behavior and appearance based on the provided configuration.
     * The configuration is stored internally and will be automatically reapplied if the map style changes.
     *
     * @param config - The configuration object to apply to the module. Pass `undefined` to reset
     * the configuration to default values.
     *
     * @remarks
     * When a configuration is applied, the module updates its visual representation and behavior
     * accordingly. The configuration persists across map style changes, ensuring consistent
     * module behavior even when the map's base style is modified.
     *
     * @example
     * ```typescript
     * // Apply a new configuration
     * myModule.applyConfig({ visible: true, opacity: 0.8 });
     *
     * // Reset to default configuration
     * myModule.applyConfig(undefined);
     * ```
     *
     * @see {@link resetConfig} for a convenience method to reset configuration
     * @see {@link getConfig} to retrieve the current configuration
     */
    applyConfig(config: CFG | undefined) {
        this.config = this._applyConfig(config);
    }

    /**
     * Internal implementation to apply config for the specific module.
     * @param config The config to apply. this.config contains the previous configuration (if any).
     * Once the method returns config, it will be assigned to this.config.
     * @protected
     * @ignore
     */
    protected abstract _applyConfig(config: CFG | undefined): CFG | undefined;

    /**
     * Resets the configuration of this module to its default values.
     *
     * This is a convenience method that clears any previously applied configuration
     * and restores the module to its initial state. This is equivalent to calling
     * `applyConfig(undefined)`.
     *
     * @remarks
     * After calling this method, the module will behave as if no configuration was ever applied.
     * Any custom settings, styling, or behavior modifications will be removed and replaced
     * with default values.
     *
     * @example
     * ```typescript
     * // Apply some configuration
     * myModule.applyConfig({ visible: true, opacity: 0.5 });
     *
     * // Later, reset to defaults
     * myModule.resetConfig();
     * ```
     *
     * @see {@link applyConfig} to apply a new configuration
     * @see {@link getConfig} to retrieve the current configuration before resetting
     */
    resetConfig(): void {
        this.applyConfig(undefined);
    }

    private async restoreDataAndConfig() {
        // defensively declaring the module as not ready to prevent race conditions:
        this.moduleReady = false;
        if (this.sourceType === 'geojson') {
            // (We use setTimeout to compensate for a MapLibre glitch where symbol layers can't get added right after
            // a styledata event. With this setTimeout, we wait just a tiny bit more which mitigates the issue)
            setTimeout(() => this.restoreDataAndConfigImpl(), 400);
        } else {
            this.restoreDataAndConfigImpl();
        }
    }

    /**
     * implementation needed to restore the module state (data and config applied to the module).
     * to be used to restore module state after map style change
     * @protected
     * @ignore
     */
    protected restoreDataAndConfigImpl(): void {
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
    }

    /**
     * Retrieves a copy of the current module configuration.
     *
     * This method returns a shallow copy of the configuration object that is currently
     * applied to the module. If no configuration has been applied, it returns `undefined`.
     *
     * @returns A shallow copy of the current configuration object, or `undefined` if no
     * configuration is currently applied. The returned object is a copy to prevent
     * unintended modifications to the internal state.
     *
     * @remarks
     * The returned configuration object is a shallow copy, which means that while the
     * top-level properties are copied, any nested objects or arrays are still referenced
     * from the original configuration. This is sufficient for most use cases but should
     * be kept in mind when dealing with complex configurations.
     *
     * @example
     * ```typescript
     * // Apply a configuration
     * myModule.applyConfig({ visible: true, opacity: 0.8 });
     *
     * // Later, retrieve the current configuration
     * const currentConfig = myModule.getConfig();
     * console.log(currentConfig); // { visible: true, opacity: 0.8 }
     *
     * // When no config is applied
     * myModule.resetConfig();
     * console.log(myModule.getConfig()); // undefined
     * ```
     *
     * @see {@link applyConfig} to modify the configuration
     * @see {@link resetConfig} to clear the configuration
     */
    getConfig() {
        return this.config && { ...this.config };
    }

    /**
     * Gets the source and layer identifiers for all sources managed by this module.
     *
     * This property provides access to the MapLibre source and layer IDs that were created
     * and are managed by this module. These IDs can be used to interact directly with
     * MapLibre's API or to identify which layers belong to this module.
     *
     * @returns A record mapping each source name to its corresponding source ID and layer IDs.
     * Each entry contains the MapLibre source identifier and an array of layer identifiers
     * associated with that source.
     *
     * @remarks
     * The returned IDs are useful when you need to:
     * - Directly manipulate layers using MapLibre's native API
     * - Identify which layers on the map belong to this module
     * - Set layer ordering or positioning relative to other layers
     * - Access source or layer properties through MapLibre methods
     *
     * @example
     * ```typescript
     * const ids = myModule.sourceAndLayerIDs;
     * console.log(ids);
     * // {
     * //   mySource: {
     * //     sourceID: 'my-source-id',
     * //     layerIDs: ['layer-1', 'layer-2']
     * //   }
     * // }
     *
     * // Use with MapLibre API
     * const map = myModule.mapLibreMap;
     * ids.mySource.layerIDs.forEach(layerId => {
     *   map.setLayoutProperty(layerId, 'visibility', 'visible');
     * });
     * ```
     */
    get sourceAndLayerIDs(): Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs> {
        return this._sourceAndLayerIDs;
    }
}
