import isNil from "lodash/isNil";
import { AbstractMapModule, StyleSourceWithLayers, EventsModule, EventsProxy } from "../core";
import { VectorTilePOIsConfig } from ".";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { POI_SOURCE_ID } from "../core/layers/sourcesIDs";

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class VectorTilePOIs extends AbstractMapModule<VectorTilePOIsConfig> {
    private poi?: StyleSourceWithLayers;

    protected init(config?: VectorTilePOIsConfig): void {
        const poiRuntimeSource = this.mapLibreMap.getSource(POI_SOURCE_ID);
        if (poiRuntimeSource) {
            this.poi = new StyleSourceWithLayers(this.mapLibreMap, poiRuntimeSource);
        }

        if (config) {
            this.applyConfig(config);
        }
    }

    protected loadLayersToEventProxy(event: EventsProxy): void {
        if (this.poi) {
            event.add(this.poi);
        }
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
        this.callWhenMapReady(() => {
            if (this.poi) {
                this.poi.setAllLayersVisible(visible);
            } else {
                console.error(changingWhileNotInTheStyle("POIs visibility"));
            }
        });
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.poi);
    }
}
