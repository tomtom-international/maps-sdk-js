import { Map } from "maplibre-gl";
import { TomTomMap } from "../TomTomMap";

/**
 * Contains the IDs of a source and its related layers.
 * * Using source and layer ids you can customize them using MapLibre.
 */
export type SourceWithLayerIDs = {
    sourceID: string;
    layerIDs: string[];
};

/**
 * Base class for all Maps SDK map modules.
 */
export abstract class AbstractMapModule<
    SOURCE_AND_LAYER_IDS extends Record<string, SourceWithLayerIDs>,
    CFG = undefined
> {
    protected readonly tomtomMap: TomTomMap;
    protected readonly mapLibreMap: Map;
    protected config?: CFG;
    protected readonly _sourceAndLayerIDs: SOURCE_AND_LAYER_IDS;

    /**
     * Builds this module based on a given Maps SDK map.
     * @param tomtomMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(tomtomMap: TomTomMap, config?: CFG) {
        this.tomtomMap = tomtomMap;
        this.mapLibreMap = tomtomMap.mapLibreMap;
        this._sourceAndLayerIDs = this.initSourcesWithLayers(config);
        if (config) {
            this.applyConfig(config);
        }
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     */
    protected abstract initSourcesWithLayers(config?: CFG): SOURCE_AND_LAYER_IDS;

    /**
     * Applies the configuration to this module.
     * @param config The configuration to apply. If undefined, the configuration will be reset to defaults.
     */
    applyConfig(config: CFG | undefined): void {
        this._applyConfig(config);
        this.config = config;
    }

    /**
     * Internal implementation to apply config for the specific module.
     * @param config The config to apply. this.config contains the previous configuration (if any).
     * Once the method returns, it will be assigned to this.config.
     * @protected
     */
    protected abstract _applyConfig(config: CFG | undefined): void;

    /**
     * Resets the configuration of this module to default values and has them applied if necessary.
     * * Any previously applied configuration gets removed.
     */
    resetConfig(): void {
        this.applyConfig(undefined);
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
    get sourceAndLayerIDs() {
        return this._sourceAndLayerIDs;
    }
}
