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

type BaseSourceAndLayers = {
    vectorTiles: StyleSourceWithLayers;
};

export class BaseMapModule extends AbstractMapModule<BaseSourceAndLayers, StyleModuleConfig> {
    /**
     * Gets the BaseMap Module for the given TomTomMap and configuration once the map is ready.
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: StyleModuleConfig): Promise<BaseMapModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new BaseMapModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: StyleModuleConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const source = this.mapLibreMap.getSource(BASE_MAP_SOURCE_ID);
        if (!source) {
            throw notInTheStyle(`init ${BaseMapModule.name} with source ID ${BASE_MAP_SOURCE_ID}`);
        }
        return { vectorTiles: new StyleSourceWithLayers(this.mapLibreMap, source) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: StyleModuleConfig | undefined) {
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
