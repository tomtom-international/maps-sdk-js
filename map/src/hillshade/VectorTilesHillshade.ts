import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import {
    AbstractMapModule,
    EventsModule,
    HILLSHADE_SOURCE_ID,
    SourceAndLayerIDs,
    StyleSourceWithLayers
} from "../shared";
import { notInTheStyle } from "../shared/ErrorMessages";
import { TomTomMap } from "../TomTomMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";

/**
 * IDs of sources and layers for hillshade module.
 */
export type HillshadeModuleSourcesAndLayersIds = {
    /**
     * Hillshade source id with corresponding layers ids.
     */
    hillshadeIDs: SourceAndLayerIDs;
};

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<
    HillshadeModuleSourcesAndLayersIds,
    VectorTilesHillshadeConfig
> {
    private hillshade!: StyleSourceWithLayers;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: VectorTilesHillshadeConfig): Promise<VectorTilesHillshade> {
        await waitUntilMapIsReady(tomtomMap);
        return new VectorTilesHillshade(tomtomMap, config);
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
        return {
            hillshadeIDs: {
                sourceID: HILLSHADE_SOURCE_ID,
                layerIDs: this.hillshade.layerSpecs.map((layerSpec) => layerSpec.id)
            }
        };
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
        this.tomtomMap._eventsProxy.ensureAdded(this.hillshade, interactive);
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
        return new EventsModule(this.tomtomMap._eventsProxy, this.hillshade);
    }
}
