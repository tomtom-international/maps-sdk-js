import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import { AbstractMapModule, StyleSourceWithLayers, EventsModule, EventsProxy } from "../core";
import { asDefined } from "../core/AssertionUtils";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { HILLSHADE_SOURCE_ID } from "../core/layers/sourcesIDs";

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<VectorTilesHillshadeConfig> {
    private hillshade?: StyleSourceWithLayers;

    protected init(config?: VectorTilesHillshadeConfig): void {
        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (hillshadeSource) {
            this.hillshade = new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource);
        }

        if (config) {
            this.applyConfig(config);
        }
    }

    protected loadLayersToEventProxy(event: EventsProxy): void {
        event.add([asDefined(this.hillshade)]);
    }

    applyConfig(config: VectorTilesHillshadeConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
    }

    setVisible(visible: boolean): void {
        this.callWhenMapReady(() => {
            if (this.hillshade) {
                this.hillshade.setAllLayersVisible(visible);
            } else {
                console.error(changingWhileNotInTheStyle("hillshade visibility"));
            }
        });
    }

    isVisible(): boolean {
        return !!this.hillshade?.isAnyLayerVisible();
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.hillshade);
    }
}
