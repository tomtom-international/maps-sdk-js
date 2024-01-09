import isNil from "lodash/isNil";
import { TomTomMap } from "../init";
import { AbstractMapModule, BASE_MAP_SOURCE_ID, EventsModule, StyleSourceWithLayers } from "../shared";
import { notInTheStyle } from "../shared/errorMessages";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { BaseMapLayerGroups, BaseMapModuleConfig, BaseMapModuleInitConfig } from "./types/baseMapModuleConfig";
import { buildBaseMapLayerGroupFilter, buildLayerGroupFilter } from "./layerGroups";

type BaseSourceAndLayers = {
    vectorTiles: StyleSourceWithLayers;
};

/**
 * A Base Map Module encompasses the base map layers and their vector tile sources.
 * * Examples are the background, water, land, roads, buildings, etc.
 * * Multiple base map modules can be gotten from the same map with different layer groups (e.g. only land, only roads, etc). See {@link BaseMapLayerGroupName}.
 * * It does not include the traffic, pois, nor hillshade, which come from different sources and are handled in their respective modules.
 */
export class BaseMapModule extends AbstractMapModule<BaseSourceAndLayers, BaseMapModuleConfig> {
    /**
     * Gets the BaseMap Module for the given TomTomMap and configuration once the map is ready.
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: BaseMapModuleInitConfig): Promise<BaseMapModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new BaseMapModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: BaseMapModuleConfig) {
        super("style", map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config: BaseMapModuleInitConfig | undefined) {
        const source = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${BASE_MAP_SOURCE_ID}`);
        }

        return {
            vectorTiles: new StyleSourceWithLayers(
                this.mapLibreMap,
                source,
                buildBaseMapLayerGroupFilter(config?.layerGroupsFilter)
            )
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: BaseMapModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        if (config?.layerGroupsVisibility) {
            this.setVisible(config.layerGroupsVisibility.visible, { layerGroups: config.layerGroupsVisibility });
        }

        // We merge the given config with the previous one to ensure init config parameters are kept:
        // (the init config can have more parameters than the runtime one)
        return { ...this.config, ...config };
    }

    isVisible(): boolean {
        return this.sourcesWithLayers.vectorTiles.isAnyLayerVisible();
    }

    setVisible(visible: boolean, options?: { layerGroups?: BaseMapLayerGroups }): void {
        if (!options?.layerGroups) {
            // We remove the layer groups visibility from the config if it was there:
            delete this.config?.layerGroupsVisibility;
            this.config = { ...this.config, visible };
        } else {
            this.config = { ...this.config, layerGroupsVisibility: { ...options.layerGroups, visible } };
        }

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.vectorTiles.setLayersVisible(
                visible,
                options?.layerGroups && buildLayerGroupFilter(options?.layerGroups)
            );
        }
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.vectorTiles);
    }
}
