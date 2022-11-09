import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";
import { MapModuleConfig } from "./types/MapModuleConfig";

/**
 * Base class for all GO SDK map modules.
 */
export abstract class AbstractMapModule<CFG extends MapModuleConfig> {
    private readonly goSDKMap: GOSDKMap;
    protected readonly mapLibreMap: Map;
    config?: MapModuleConfig;

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
}
