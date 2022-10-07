import isNil from "lodash/isNil";
import { VectorTilesHillshadeConfig } from ".";
import { AbstractMapModule, filterLayersBySource, goSDKSourceFromRuntime, SourceWithLayers } from "../core";

export const hillshadeSourceID = "hillshade";

/**
 * Vector tiles hillshade module.
 * * Hillshade refers to the semi-transparent terrain layer.
 */
export class VectorTilesHillshade extends AbstractMapModule<VectorTilesHillshadeConfig> {
    private hillshade?: SourceWithLayers;

    protected init(config?: VectorTilesHillshadeConfig): void {
        const hillshadeSource = this.mapLibreMap.getSource(hillshadeSourceID);
        if (hillshadeSource) {
            this.hillshade = new SourceWithLayers(
                this.mapLibreMap,
                goSDKSourceFromRuntime(hillshadeSource),
                filterLayersBySource(this.mapLibreMap, hillshadeSourceID)
            );

            if (config) {
                this.applyConfig(config);
            }
        }
    }

    public applyConfig(config: VectorTilesHillshadeConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
    }

    public setVisible(visible: boolean): void {
        if (this.hillshade) {
            this.hillshade.setAllLayersVisible(visible);
        } else {
            console.error(
                "Trying to change hillshade visibility while it is not in the map style. " +
                    "Is the map style not loaded yet, or did you exclude hillshade when loading the map?"
            );
        }
    }

    public isVisible(): boolean {
        return !!this.hillshade?.isAnyLayerVisible();
    }

    public toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }
}
