import isNil from "lodash/isNil";
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

export class BaseMapModule extends AbstractMapModule<BaseSourceAndLayers, VectorTileMapModuleConfig> {
    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: VectorTileMapModuleConfig) {
        await waitUntilMapIsReady(tomtomMap);
        return new BaseMapModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: VectorTileMapModuleConfig) {
        super(map, config);
    }

    protected _initSourcesWithLayers() {
        const source = this.mapLibreMap.getSource(VECTOR_TILES_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${VECTOR_TILES_SOURCE_ID}`);
        }
        return { vectorTiles: new StyleSourceWithLayers(this.mapLibreMap, source) };
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
