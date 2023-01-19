import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import { AbstractMapModule, EventsModule, HILLSHADE_SOURCE_ID, StyleSourceWithLayers } from "../core";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<VectorTilesHillshadeConfig> {
    private hillshade?: StyleSourceWithLayers;

    private constructor(goSDKMap: GOSDKMap, config?: VectorTilesHillshadeConfig) {
        super(goSDKMap, config);

        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);

        if (hillshadeSource) {
            this.hillshade = new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource);
        }

        if (config) {
            this.applyConfig(config);

            if (config.interactive && this.hillshade) {
                goSDKMap._eventsProxy.add(this.hillshade);
            }
        }
    }

    applyConfig(config: VectorTilesHillshadeConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
    }

    setVisible(visible: boolean): void {
        if (this.hillshade) {
            this.hillshade.setAllLayersVisible(visible);
        } else {
            console.error(changingWhileNotInTheStyle("hillshade visibility"));
        }
    }

    isVisible(): boolean {
        return !!this.hillshade?.isAnyLayerVisible();
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.hillshade);
    }

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
}
