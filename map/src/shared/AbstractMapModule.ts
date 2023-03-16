import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";
import { AbstractSourceWithLayers } from "./SourceWithLayers";

/**
 * Base class for all GO SDK map modules.
 */
export abstract class AbstractMapModule<
    SOURCES_WITH_LAYERS extends Record<string, AbstractSourceWithLayers>,
    CFG = undefined
> {
    protected readonly goSDKMap: GOSDKMap;
    protected readonly mapLibreMap: Map;
    protected config?: CFG;
    protected readonly _sourcesWithLayers: SOURCES_WITH_LAYERS;

    /**
     * Builds this module based on a given GO SDK map.
     * @param goSDKMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(goSDKMap: GOSDKMap, config?: CFG) {
        this.goSDKMap = goSDKMap;
        this.mapLibreMap = goSDKMap.mapLibreMap;
        this._sourcesWithLayers = this.initSourcesWithLayers(config);
        if (config) {
            this.applyConfig(config);
        }
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     */
    protected abstract initSourcesWithLayers(config?: CFG): SOURCES_WITH_LAYERS;

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
     * Allows access to sources and layers used in this module.
     */
    get sourcesWithLayers() {
        return this._sourcesWithLayers;
    }
}
