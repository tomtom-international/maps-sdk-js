import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import { AbstractMapModule, EventsModule, HILLSHADE_SOURCE_ID, StyleSourceWithLayers } from "../shared";
import { notInTheStyle } from "../shared/ErrorMessages";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";

/**
 * Enabling access to hillshade module sources and layers for easy customization.
 */
export type HillshadeModuleSourcesWithLayers = {
    /**
     * Hillshade source with corresponding layers.
     */
    hillshadeSourceWithLayers: StyleSourceWithLayers;
};

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<
    HillshadeModuleSourcesWithLayers,
    VectorTilesHillshadeConfig
> {
    private hillshade!: StyleSourceWithLayers;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: VectorTilesHillshadeConfig): Promise<VectorTilesHillshade> {
        await waitUntilMapIsReady(goSDKMap);
        return new VectorTilesHillshade(goSDKMap, config);
    }

    protected initSourcesWithLayers() {
        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (!hillshadeSource) {
            throw notInTheStyle(`init ${VectorTilesHillshade.name} with source ID ${HILLSHADE_SOURCE_ID}`);
        }
        this.hillshade = new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource);

        if (this.hillshade) {
            this._addModuleToEventsProxy(true);
        }
        return { hillshadeSourceWithLayers: this.hillshade };
    }

    _applyConfig(config: VectorTilesHillshadeConfig | undefined): void {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }

        if (this.hillshade && config && !isNil(config.interactive)) {
            this._addModuleToEventsProxy(config.interactive);
        }
    }

    private _addModuleToEventsProxy(interactive: boolean) {
        this.goSDKMap._eventsProxy.ensureAdded(this.hillshade, interactive);
    }

    setVisible(visible: boolean): void {
        this.hillshade.setAllLayersVisible(visible);
    }

    isVisible(): boolean {
        return this.hillshade.isAnyLayerVisible();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.hillshade);
    }
}
