import isNil from "lodash/isNil";
import { AbstractMapModule, filterLayersBySource, goSDKSourceFromRuntime, SourceWithLayers } from "../core";
import { VectorTilePOIsConfig } from ".";

export const poiSourceID = "poiTiles";

/**
 * Vector tile POIs map module.
 * * Refers to the POIs layer from the vector map.
 */
export class VectorTilePOIs extends AbstractMapModule<VectorTilePOIsConfig> {
    private poi?: SourceWithLayers;

    protected init(config?: VectorTilePOIsConfig): void {
        const poiRuntimeSource = this.mapLibreMap.getSource(poiSourceID);
        if (poiRuntimeSource) {
            this.poi = new SourceWithLayers(
                this.mapLibreMap,
                goSDKSourceFromRuntime(poiRuntimeSource),
                filterLayersBySource(this.mapLibreMap, poiSourceID)
            );
            if (config) {
                this.applyConfig(config);
            }
        }
    }

    public applyConfig(config: VectorTilePOIsConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
    }

    public isVisible(): boolean {
        return !!this.poi?.isAnyLayerVisible();
    }

    public setVisible(visible: boolean): void {
        if (this.poi) {
            this.poi.setAllLayersVisible(visible);
        } else {
            console.error(
                "Trying to change map POIs visibility while they are not in the map style. " +
                    "Is the map style not loaded yet, or did you exclude POIs when loading the map?"
            );
        }
    }

    public toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }
}
