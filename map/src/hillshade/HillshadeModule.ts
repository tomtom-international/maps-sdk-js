import isNil from "lodash/isNil";
import type { HillshadeModuleConfig } from ".";
import type { StyleModuleInitConfig } from "../shared";
import { AbstractMapModule, EventsModule, HILLSHADE_SOURCE_ID, StyleSourceWithLayers } from "../shared";
import { notInTheStyle } from "../shared/errorMessages";
import type { TomTomMap } from "../TomTomMap";
import { prepareForModuleInit } from "../shared/mapUtils";

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
     * @param map The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(map: TomTomMap, config?: StyleModuleInitConfig & HillshadeModuleConfig): Promise<HillshadeModule> {
        await prepareForModuleInit(map, config?.ensureAddedToStyle, HILLSHADE_SOURCE_ID, "hillshade");
        return new HillshadeModule(map, config);
    }

    private constructor(map: TomTomMap, config?: HillshadeModuleConfig) {
        super("style", map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (!hillshadeSource) {
            throw notInTheStyle(`init ${HillshadeModule.name} with source ID ${HILLSHADE_SOURCE_ID}`);
        }
        return { hillshade: new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: HillshadeModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        return config;
    }

    setVisible(visible: boolean): void {
        this.config = {
            ...this.config,
            visible
        };

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.hillshade.setLayersVisible(visible);
        }
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
