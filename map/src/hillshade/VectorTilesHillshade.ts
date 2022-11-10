import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import { AbstractMapModule, StyleSourceWithLayers } from "../core";

export const hillshadeSourceID = "hillshade";

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<VectorTilesHillshadeConfig> {
    private hillshade?: StyleSourceWithLayers;

    protected init(config?: VectorTilesHillshadeConfig): void {
        const hillshadeSource = this.mapLibreMap.getSource(hillshadeSourceID);
        if (hillshadeSource) {
            this.hillshade = new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource);
            if (config) {
                this.applyConfig(config);
            }
        }
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
                console.error(
                    "Trying to change hillshade visibility while it is not in the map style. " +
                        "Is the map style not loaded yet, or did you exclude hillshade when loading the map?"
                );
            }
        });
    }

    isVisible(): boolean {
        return !!this.hillshade?.isAnyLayerVisible();
    }

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }
}
