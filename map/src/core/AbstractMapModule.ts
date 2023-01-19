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
    protected constructor(goSDKMap: GOSDKMap, config?: CFG) {
        this.goSDKMap = goSDKMap;
        this.mapLibreMap = goSDKMap.mapLibreMap;
        this.config = config;
    }

    /**
     * Initializes the module events and allows to register handlers to them
     * @protected
     * @ignore
     */
    protected abstract get events(): EventsModule | Record<string, EventsModule>;

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
