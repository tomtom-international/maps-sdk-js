import { Map } from "maplibre-gl";
import { TomTomMap } from "../TomTomMap";
import { EventsProxy } from "./EventsProxy";
import { SourcesWithLayers, SourceWithLayerIDs } from "./types";

/**
 * Base class for all Maps SDK map modules.
 */
export abstract class AbstractMapModule<SOURCES_WITH_LAYERS extends SourcesWithLayers, CFG = undefined> {
    protected readonly tomtomMap: TomTomMap;
    protected readonly eventsProxy: EventsProxy;
    protected readonly mapLibreMap: Map;
    protected sourcesWithLayers!: SOURCES_WITH_LAYERS;
    protected _sourceAndLayerIDs!: Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
    protected config?: CFG;

    /**
     * Builds this module based on a given Maps SDK map.
     * @param tomtomMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(tomtomMap: TomTomMap, config?: CFG) {
        this.tomtomMap = tomtomMap;
        this.eventsProxy = tomtomMap._eventsProxy;
        this.tomtomMap._addStyleChangeHandler(() => this.restoreDataAndConfig());
        this.mapLibreMap = tomtomMap.mapLibreMap;
        this.initSourcesWithLayers(config);
        if (config) {
            this.applyConfig(config);
        }
    }

    protected initSourcesWithLayers(config?: CFG, restore?: boolean): void {
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
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     */
    protected abstract _initSourcesWithLayers(config?: CFG, restore?: boolean): SOURCES_WITH_LAYERS;

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
     */
    protected abstract _applyConfig(config: CFG | undefined): CFG | undefined;

    /**
     * Resets the configuration of this module to default values and has them applied if necessary.
     * * Any previously applied configuration gets removed.
     */
    resetConfig(): void {
        this.applyConfig(undefined);
    }

    /**
     * implementation needed to restore the module state (data and config applied to the module).
     * to be used to restore module state after map style change
     * @protected
     */
    protected restoreDataAndConfig(): void {
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
