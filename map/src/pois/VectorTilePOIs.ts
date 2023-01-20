import isNil from "lodash/isNil";
import { AbstractMapModule, EventsModule, POI_SOURCE_ID, StyleSourceWithLayers } from "../core";
import { VectorTilePOIsConfig } from ".";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { GOSDKMap } from "../GOSDKMap";

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class VectorTilePOIs extends AbstractMapModule<VectorTilePOIsConfig> {
    private poi?: StyleSourceWithLayers;

    private constructor(goSDKMap: GOSDKMap, config?: VectorTilePOIsConfig) {
        super(goSDKMap, config);

        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (poiRuntimeSource) {
            this.poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
        }

        if (config) {
            this.applyConfig(config);

            if (config.interactive && this.poi) {
                goSDKMap._eventsProxy.add(this.poi);
            }
        }
    }

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: VectorTilePOIsConfig): Promise<VectorTilePOIs> {
        await waitUntilMapIsReady(goSDKMap);
        return new VectorTilePOIs(goSDKMap, config);
    }

    applyConfig(config: VectorTilePOIsConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
    }

    isVisible(): boolean {
        return !!this.poi?.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        if (this.poi) {
            this.poi.setAllLayersVisible(visible);
        } else {
            console.error(changingWhileNotInTheStyle("POIs visibility"));
        }
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.poi);
    }
}
