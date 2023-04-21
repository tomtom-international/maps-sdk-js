import { isNil } from "lodash";
import { TomTomMap } from "../init";
import {
    AbstractMapModule,
    EventsModule,
    StyleSourceWithLayers,
    VECTOR_TILES_SOURCE_ID,
    VectorTileMapModuleConfig
} from "../shared";
import { notInTheStyle } from "../shared/ErrorMessages";
import { waitUntilMapIsReady } from "../shared/mapUtils";

type BaseSourceAndLayers = {
    vectorTiles: StyleSourceWithLayers;
};

export class BaseMap extends AbstractMapModule<BaseSourceAndLayers, VectorTileMapModuleConfig> {
    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: VectorTileMapModuleConfig) {
        waitUntilMapIsReady(tomtomMap);
        // We make sure that all data source is loaded before create a new instance of BaseMap module
        await tomtomMap.mapLibreMap.once("sourcedata");
        return new BaseMap(tomtomMap, config);
    }

    protected _initSourcesWithLayers() {
        const vectorTitleRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_SOURCE_ID);
        if (!vectorTitleRuntimeSource) {
            throw notInTheStyle(`init ${BaseMap.name} with source ID ${VECTOR_TILES_SOURCE_ID}`);
        }
        const vectorTiles = new StyleSourceWithLayers(this.mapLibreMap, vectorTitleRuntimeSource);
        return { vectorTiles };
    }

    protected _applyConfig(config: VectorTileMapModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
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
        this.config = {
            ...this.config,
            visible
        };
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.vectorTiles);
    }
}
