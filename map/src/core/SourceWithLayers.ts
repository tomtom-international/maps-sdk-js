import { LayerSpecification, Map } from "maplibre-gl";
import { GOSDKSource } from "./GOSDKSource";
import { GOSDKLayerSpec, LayerSpecFilter, LayerSpecWithSource } from "./types/GOSDKLayer";

/**
 * @ignore
 * @param loadedMap
 * @param sourceID
 */
export const filterLayersBySource = (loadedMap: Map, sourceID: string): LayerSpecification[] => {
    return loadedMap.getStyle().layers.filter((layer) => (layer as LayerSpecWithSource).source === sourceID);
};

/**
 * Contains a source and the layers to render its data.
 * @ignore
 */
export class SourceWithLayers<S extends GOSDKSource = GOSDKSource> {
    readonly layerSpecs: LayerSpecification[];

    constructor(readonly map: Map, readonly source: S, layerSpecs: GOSDKLayerSpec[]) {
        // We assign the source ID to the layers here:
        this.layerSpecs = layerSpecs.map((layerSpec) => ({ ...layerSpec, source: source.id } as LayerSpecification));
    }

    public ensureAddedToMap = (beforeId?: string): void => {
        this.source.ensureAddedToMap(this.map);
        for (const layerSpec of this.layerSpecs) {
            if (!this.map.getLayer(layerSpec.id)) {
                this.map.addLayer(layerSpec, beforeId);
            }
        }
    };

    public ensureAddedToMapWithVisibility = (visible: boolean, beforeId?: string): void => {
        this.ensureAddedToMap(beforeId);
        this.setAllLayersVisible(visible);
    };

    private getLayerSpecs = (filter?: LayerSpecFilter) => (filter ? this.layerSpecs.filter(filter) : this.layerSpecs);

    public isAnyLayerVisible = (filter?: (layerSpec: LayerSpecification) => boolean): boolean =>
        this.getLayerSpecs(filter).some((layer) => this.map.getLayoutProperty(layer.id, "visibility") !== "none");

    public setAllLayersVisible = (visible: boolean, filter?: LayerSpecFilter): void => {
        for (const layerSpec of this.getLayerSpecs(filter)) {
            this.map.setLayoutProperty(layerSpec.id, "visibility", visible ? "visible" : "none");
        }
    };
}
