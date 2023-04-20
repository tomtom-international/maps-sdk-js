import isNil from "lodash/isNil";
import { HillshadeModuleConfig } from ".";
import { AbstractMapModule, EventsModule, HILLSHADE_SOURCE_ID, StyleSourceWithLayers } from "../shared";
import { notInTheStyle } from "../shared/ErrorMessages";
import { TomTomMap } from "../TomTomMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";

/**
 * IDs of sources and layers for hillshade module.
 */
type HillshadeSourcesWithLayers = {
    hillshade: StyleSourceWithLayers;
};

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class HillshadeModule extends AbstractMapModule<HillshadeSourcesWithLayers, HillshadeModuleConfig> {
    /**
     * Gets the Hillshade Module for the given TomTomMap and configuration once the map is ready.
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: HillshadeModuleConfig): Promise<HillshadeModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new HillshadeModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: HillshadeModuleConfig) {
        super(map, config);
    }

    protected _initSourcesWithLayers() {
        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (!hillshadeSource) {
            throw notInTheStyle(`init ${HillshadeModule.name} with source ID ${HILLSHADE_SOURCE_ID}`);
        }
        return { hillshade: new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource) };
    }

    _applyConfig(config: HillshadeModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        return config;
    }

    setVisible(visible: boolean): void {
        this.sourcesWithLayers.hillshade.setAllLayersVisible(visible);
        this.config = {
            ...this.config,
            visible
        };
    }

    isVisible(): boolean {
        return this.sourcesWithLayers.hillshade.isAnyLayerVisible();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.hillshade);
    }
}
