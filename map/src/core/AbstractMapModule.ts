import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";
import { EventsModule } from "./EventsModule";

/**
 * Base class for all GO SDK map modules.
 */
export abstract class AbstractMapModule<CFG = undefined> {
    protected readonly goSDKMap: GOSDKMap;
    protected readonly mapLibreMap: Map;
    protected config: CFG | undefined | null;

    /**
     * Builds this module based on a given GO SDK map.
     * @param goSDKMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(goSDKMap: GOSDKMap, config?: CFG) {
        this.goSDKMap = goSDKMap;
        this.mapLibreMap = goSDKMap.mapLibreMap;
        this.initSourcesWithLayers();
        if (config) {
            this.applyConfig(config);
        }
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     */
    protected abstract initSourcesWithLayers(): void;

    /**
     * Applies the configuration to this module.
     * @param config The configuration to apply. If null, the configuration will be reset to defaults.
     */
    applyConfig(config: CFG | null): void {
        this._applyConfig(config);
        this.config = config;
    }

    /**
     * Internal implementation to apply config for the specific module.
     * @param config The config to apply. this.config contains the previous configuration (if any).
     * Once the method returns, it will be assigned to this.config.
     * @protected
     */
    protected abstract _applyConfig(config: CFG | null): void;

    /**
     * Resets the configuration of this module to default values and has them applied if necessary.
     * * Any previously applied configuration gets removed.
     */
    resetConfig(): void {
        this.applyConfig(null);
    }

    /**
     * Gets a copy of the current module config, if defined.
     */
    getConfig() {
        return this.config && { ...this.config };
    }

    /**
     * Initializes the module events and allows to register handlers to them
     * @protected
     * @ignore
     */
    protected abstract get events(): EventsModule | Record<string, EventsModule>;
}
