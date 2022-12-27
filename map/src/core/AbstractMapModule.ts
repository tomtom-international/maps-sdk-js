import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";
import { EventsModule } from "./EventsModule";

/**
 * Base class for all GO SDK map modules.
 */
export abstract class AbstractMapModule<CFG = undefined> {
    protected readonly goSDKMap: GOSDKMap;
    protected readonly mapLibreMap: Map;
    protected config?: CFG;

    /**
     * Builds this module based on a given GO SDK map.
     * @param goSDKMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    constructor(goSDKMap: GOSDKMap, config?: CFG) {
        this.goSDKMap = goSDKMap;
        this.mapLibreMap = goSDKMap.mapLibreMap;
        this.config = config;
        this.callWhenMapReady(() => this.init(config));
    }

    protected callWhenMapReady(func: () => void) {
        if (this.goSDKMap.mapReady || this.mapLibreMap.isStyleLoaded()) {
            func();
        } else {
            this.mapLibreMap.once("styledata", () => func());
        }
    }

    /**
     * Initializes the module.
     * * Called when the map is ensured to be ready.
     * @param config The optional configuration to apply.
     * @protected
     * @ignore
     */
    protected abstract init(config?: CFG): void;

    /**
     * Initializes the module events.
     * @protected
     * @ignore
     */
    protected abstract get events(): EventsModule | { [k: string]: EventsModule };

    /**
     * Merges the given optional config with the module optional config and returns it.
     * * Does not change the module config itself.
     * * Intended for individual usages that override or extend on the module config.
     * @protected
     * @ignore
     */
    protected getMergedConfig(config: CFG = undefined as CFG): CFG | undefined {
        return this.config
            ? {
                  ...this.config,
                  ...(config || {})
              }
            : config;
    }
}
