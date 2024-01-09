import { Map } from "maplibre-gl";
import { TomTomMap } from "../TomTomMap";
import { EventsProxy } from "./EventsProxy";
import { SourcesWithLayers, SourceWithLayerIDs } from "./types";
import { MapModuleSource } from "./types/mapModule";

/**
 * Base class for all Maps SDK map modules.
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
     * @see waitUntilSourcesAndLayersAdded
     * @private
     */
    private addingSourcesAndLayers = false;

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
        this.tomtomMap.addStyleChangeHandler(() => this.restoreDataAndConfig());
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
        this.addingSourcesAndLayers = true;
        this.sourcesWithLayers = this._initSourcesWithLayers(config, restore);
        this._sourceAndLayerIDs = Object.fromEntries(
            Object.entries(this.sourcesWithLayers).map(([name, sourceWithLayers]) => [
                name,
                sourceWithLayers.sourceAndLayerIDs
            ])
        ) as Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
        if (restore) {
            this.eventsProxy.updateIfRegistered(this.sourcesWithLayers);
        }
        this.addingSourcesAndLayers = false;
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     * @ignore
     */
    protected abstract _initSourcesWithLayers(config?: CFG, restore?: boolean): SOURCES_WITH_LAYERS;

    protected async waitUntilSourcesAndLayersAdded(): Promise<void> {
        if (this.addingSourcesAndLayers) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (!this.addingSourcesAndLayers) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 200);
            });
        }
    }

    /**
     * Applies the configuration to this module.
     * @param config The configuration to apply. If undefined, the configuration will be reset to defaults.
     */
    applyConfig(config: CFG | undefined): void {
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
     * Resets the configuration of this module to default values and has them applied if necessary.
     * * Any previously applied configuration gets removed.
     */
    resetConfig(): void {
        this.applyConfig(undefined);
    }

    private async restoreDataAndConfig() {
        // defensively raising the state flag already to prevent race conditions:
        this.addingSourcesAndLayers = true;
        if (this.sourceType == "geojson") {
            // (We use setTimeout to compensate for a MapLibre glitch where symbol layers can't get added right after
            // a styledata event. With this setTimeout, we wait just a tiny bit more which mitigates the issue)
            setTimeout(() => this.restoreDataAndConfigImpl(), 250);
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
     * Gets a copy of the current module config, if defined.
     */
    getConfig() {
        return this.config && { ...this.config };
    }

    /**
     * Returns sources and layers IDs.
     */
    get sourceAndLayerIDs(): Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs> {
        return this._sourceAndLayerIDs;
    }
}
