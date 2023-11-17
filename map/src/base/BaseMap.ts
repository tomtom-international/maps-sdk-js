import isNil from "lodash/isNil";
import { TomTomMap } from "../init";
import {
    AbstractMapModule,
    EventsModule,
    StyleSourceWithLayers,
    BASE_MAP_SOURCE_ID,
    StyleModuleConfig
} from "../shared";
import { notInTheStyle } from "../shared/errorMessages";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { BaseMapModuleConfig } from "./types/baseMapModuleConfig";
import { filterLayerByGroups } from "./layerGroups";
import { LayerSpecification } from "maplibre-gl";
import { poiLayerIDs } from "../pois";

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
    static async get(tomtomMap: TomTomMap, config?: BaseMapModuleConfig): Promise<BaseMapModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new BaseMapModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: BaseMapModuleConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config: BaseMapModuleConfig | undefined) {
        const source = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${BASE_MAP_SOURCE_ID}`);
        }
        const layersFilter = (layer: LayerSpecification): boolean =>
            (!config?.layerGroups || filterLayerByGroups(layer, config?.layerGroups)) &&
            !poiLayerIDs.includes(layer.id);
        return {
            vectorTiles: new StyleSourceWithLayers(this.mapLibreMap, source, layersFilter)
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: StyleModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        return config;
    }

    isVisible(): boolean {
        return this.sourcesWithLayers.vectorTiles.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        this.sourcesWithLayers.vectorTiles.setAllLayersVisible(visible);
        this.config = { ...this.config, visible };
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.vectorTiles);
    }
}
