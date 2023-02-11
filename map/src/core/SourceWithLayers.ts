import {
    GeoJSONSource,
    GeoJSONSourceSpecification,
    LayerSpecification,
    Map,
    Source,
    SourceSpecification
} from "maplibre-gl";
import { GOSDKSource } from "./GOSDKSource";
import { LayerSpecFilter, LayerSpecWithSource, ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from "./types";
import { FeatureCollection } from "geojson";
import { asDefined } from "./AssertionUtils";

/**
 * Contains a source and the layers to render its data.
 * @ignore
 */
export abstract class AbstractSourceWithLayers<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source,
    LAYER_SPEC extends LayerSpecification = LayerSpecification
> {
    constructor(
        readonly map: Map,
        readonly source: GOSDKSource<SOURCE_SPEC, RUNTIME_SOURCE>,
        readonly layerSpecs: LAYER_SPEC[]
    ) {}

    isAnyLayerVisible(filter?: (layerSpec: LayerSpecification) => boolean): boolean {
        return this.getLayerSpecs(filter).some((layer) => this.isLayerVisible(layer));
    }

    areAllLayersVisible(filter?: (layerSpec: LayerSpecification) => boolean): boolean {
        return this.getLayerSpecs(filter).every((layer) => this.isLayerVisible(layer));
    }

    private getLayerSpecs(filter?: LayerSpecFilter) {
        return filter ? this.layerSpecs.filter(filter) : this.layerSpecs;
    }

    private isLayerVisible(layer: LayerSpecification): boolean {
        return this.map.getLayoutProperty(layer.id, "visibility") !== "none";
    }

    setAllLayersVisible(visible: boolean, filter?: LayerSpecFilter): void {
        for (const layerSpec of this.getLayerSpecs(filter)) {
            this.map.setLayoutProperty(layerSpec.id, "visibility", visible ? "visible" : "none");
        }
    }
}

/**
 * @ignore
 * @param loadedMap
 * @param sourceIDs
 */
export const filterLayersBySources = (loadedMap: Map, sourceIDs: string[]): LayerSpecWithSource[] =>
    loadedMap
        .getStyle()
        .layers.filter((layer) => sourceIDs.includes((layer as LayerSpecWithSource)?.source)) as LayerSpecWithSource[];

/**
 * Source with layers which are coming from the downloaded TT map style.
 * * Examples are parts of the base map, traffic, pois, and hillshade.
 */
export class StyleSourceWithLayers<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source
> extends AbstractSourceWithLayers<SourceSpecification, RUNTIME_SOURCE> {
    constructor(map: Map, runtimeSource: RUNTIME_SOURCE) {
        super(
            map,
            new GOSDKSource<SOURCE_SPEC, RUNTIME_SOURCE>(
                runtimeSource.id,
                map.getStyle().sources[runtimeSource.id] as SOURCE_SPEC,
                runtimeSource
            ),
            filterLayersBySources(map, [runtimeSource.id])
        );
    }
}

/**
 * Source with layers which originally is not in the map style but it's to be added after the map is initialized.
 */
export class AddedSourceWithLayers<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source
> extends AbstractSourceWithLayers<SOURCE_SPEC, RUNTIME_SOURCE, ToBeAddedLayerSpec> {
    constructor(map: Map, sourceID: string, sourceSpec: SOURCE_SPEC, layerSpecs: ToBeAddedLayerSpecWithoutSource[]) {
        super(
            map,
            new GOSDKSource<SOURCE_SPEC, RUNTIME_SOURCE>(sourceID, sourceSpec),
            // We ensure the source ID is assigned to the layers:
            layerSpecs.map((layerSpec) => ({ ...layerSpec, source: sourceID } as ToBeAddedLayerSpec))
        );
    }

    private ensureAddedToMap(): void {
        this.source.ensureAddedToMap(this.map);
        for (const layerSpec of this.layerSpecs) {
            if (!this.map.getLayer(layerSpec.id)) {
                this.map.addLayer(layerSpec, layerSpec.beforeID);
            }
        }
    }

    ensureAddedToMapWithVisibility(visible: boolean): void {
        this.ensureAddedToMap();
        this.setAllLayersVisible(visible);
    }
}

const emptyFeatureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: []
};

/**
 * @ignore
 */
export class GeoJSONSourceWithLayers<T extends FeatureCollection> extends AddedSourceWithLayers<
    GeoJSONSourceSpecification,
    GeoJSONSource
> {
    shownFeatures: T = emptyFeatureCollection as T;

    constructor(map: Map, sourceID: string, layerSpecs: ToBeAddedLayerSpecWithoutSource[]) {
        super(map, sourceID, { type: "geojson", data: emptyFeatureCollection }, layerSpecs);
        this.ensureAddedToMapWithVisibility(false);
    }

    show(featureCollection: T): void {
        asDefined(this.source.runtimeSource).setData(featureCollection);
        this.setAllLayersVisible(!!featureCollection?.features?.length);
        this.shownFeatures = featureCollection;
    }

    clear(): void {
        this.show(emptyFeatureCollection as T);
    }
}
