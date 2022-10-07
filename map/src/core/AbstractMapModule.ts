import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";
import { MapModuleConfig } from "./types/MapModuleConfig";

/**
 * Base class for all GO SDK map modules.
 */
export abstract class AbstractMapModule<CFG extends MapModuleConfig> {
    protected readonly mapLibreMap: Map;

    /**
     * Builds this module based on a given GO SDK map.
     * @param goSDKMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    constructor(goSDKMap: GOSDKMap, config?: CFG) {
        this.mapLibreMap = goSDKMap.mapLibreMap;
        if (this.mapLibreMap.isStyleLoaded()) {
            this.init(config);
        } else {
            this.mapLibreMap.once("styledata", () => this.init(config));
        }
    }

    protected abstract init(config?: CFG): void;
}
