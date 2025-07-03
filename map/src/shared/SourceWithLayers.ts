import type { FeatureCollection } from 'geojson';
import type {
    GeoJSONSource,
    GeoJSONSourceSpecification,
    LayerSpecification,
    Map,
    Source,
    SourceSpecification,
} from 'maplibre-gl';
import { asDefined } from './assertionUtils';
import { TomTomMapSource } from './TomTomMapSource';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    LayerSpecFilter,
    LayerSpecWithSource,
    PutEventStateOptions,
    SourceWithLayerIDs,
    SourceWithLayers,
    ToBeAddedLayerSpec,
    ToBeAddedLayerSpecWithoutSource,
} from './types';

/**
 * Contains a source and the layers to render its data.
 * @ignore
 */
export abstract class AbstractSourceWithLayers<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source,
    LAYER_SPEC extends LayerSpecification = LayerSpecification,
> {
    readonly _layerSpecs: LAYER_SPEC[];
    private _sourceAndLayerIDs!: SourceWithLayerIDs;

    constructor(
        readonly map: Map,
        readonly source: TomTomMapSource<SOURCE_SPEC, RUNTIME_SOURCE>,
        layerSpecs: LAYER_SPEC[],
    ) {
        this._layerSpecs = layerSpecs;
        this._updateSourceAndLayerIDs();
    }

    isAnyLayerVisible(filter?: LayerSpecFilter): boolean {
        return this.getLayerSpecs(filter).some((layer) => this.isLayerVisible(layer));
    }

    areAllLayersVisible(filter?: LayerSpecFilter): boolean {
        return this.getLayerSpecs(filter).every((layer) => this.isLayerVisible(layer));
    }

    private getLayerSpecs(filter?: LayerSpecFilter) {
        return filter ? this._layerSpecs.filter(filter) : this._layerSpecs;
    }

    _updateSourceAndLayerIDs(): void {
        this._sourceAndLayerIDs = { sourceID: this.source.id, layerIDs: this._layerSpecs.map((layer) => layer.id) };
    }

    private isLayerVisible(layer: LayerSpecification): boolean {
        return this.map.getLayoutProperty(layer.id, 'visibility') !== 'none';
    }

    setLayersVisible(visible: boolean, filter?: LayerSpecFilter): void {
        for (const layerSpec of this.getLayerSpecs(filter)) {
            this.map.setLayoutProperty(layerSpec.id, 'visibility', visible ? 'visible' : 'none', { validate: false });
        }
    }

    get sourceAndLayerIDs(): SourceWithLayerIDs {
        return this._sourceAndLayerIDs;
    }

    equalSourceAndLayerIDs(other: SourceWithLayers): boolean {
        return (
            this.sourceAndLayerIDs.sourceID === other.sourceAndLayerIDs.sourceID &&
            this.sourceAndLayerIDs.layerIDs.length === other.sourceAndLayerIDs.layerIDs.length &&
            this.sourceAndLayerIDs.layerIDs.every((id, index) => id === other.sourceAndLayerIDs.layerIDs[index])
        );
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
    RUNTIME_SOURCE extends Source = Source,
> extends AbstractSourceWithLayers<SourceSpecification, RUNTIME_SOURCE> {
    constructor(map: Map, runtimeSource: RUNTIME_SOURCE, filter?: LayerSpecFilter) {
        let layers = filterLayersBySources(map, [runtimeSource.id]);
        if (filter) {
            layers = layers.filter(filter);
        }
        super(
            map,
            new TomTomMapSource<SOURCE_SPEC, RUNTIME_SOURCE>(
                runtimeSource.id,
                map.getStyle().sources[runtimeSource.id] as SOURCE_SPEC,
                runtimeSource,
            ),
            layers,
        );
    }
}

/**
 * Source with layers which originally is not in the map style, but it's to be added after the map is initialized.
 */
export class AddedSourceWithLayers<
    SOURCE_SPEC extends SourceSpecification = SourceSpecification,
    RUNTIME_SOURCE extends Source = Source,
> extends AbstractSourceWithLayers<SOURCE_SPEC, RUNTIME_SOURCE, ToBeAddedLayerSpec> {
    constructor(map: Map, sourceId: string, sourceSpec: SOURCE_SPEC, layerSpecs: ToBeAddedLayerSpecWithoutSource[]) {
        super(
            map,
            new TomTomMapSource<SOURCE_SPEC, RUNTIME_SOURCE>(sourceId, sourceSpec),
            // We ensure the source ID is assigned to the layers:
            layerSpecs.map((layerSpec) => ({ ...layerSpec, source: sourceId }) as ToBeAddedLayerSpec),
        );
    }

    private ensureLayersAddedToMap(): void {
        for (const layerSpec of this._layerSpecs) {
            if (!this.map.getLayer(layerSpec.id)) {
                this.map.addLayer(layerSpec, layerSpec.beforeID);
            }
        }
    }

    ensureAddedToMapWithVisibility(visible: boolean, addLayersToMap: boolean): void {
        this.source.ensureAddedToMap(this.map);
        if (addLayersToMap) {
            this.ensureLayersAddedToMap();
            this.setLayersVisible(visible);
        }
    }
}

const emptyFeatureCollection: FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * @ignore
 */
export class GeoJSONSourceWithLayers<T extends FeatureCollection = FeatureCollection> extends AddedSourceWithLayers<
    GeoJSONSourceSpecification,
    GeoJSONSource
> {
    shownFeatures: T = emptyFeatureCollection as T;

    constructor(map: Map, sourceId: string, layerSpecs: ToBeAddedLayerSpecWithoutSource[], addLayersToMap = true) {
        // MapLibre does not reuse the given feature ID. Either we generate it on the fly or use the one from properties via promotedId value.
        // We must generate "id" property based on the feature id on the fly on "prepareForDisplay" functions.
        super(map, sourceId, { type: 'geojson', data: emptyFeatureCollection, promoteId: 'id' }, layerSpecs);
        this.ensureAddedToMapWithVisibility(false, addLayersToMap);
    }

    show(featureCollection: T): void {
        this.shownFeatures = featureCollection;
        asDefined(this.source.runtimeSource).setData(featureCollection);
        this.setLayersVisible(!!featureCollection.features.length);
    }

    clear(): void {
        this.show(emptyFeatureCollection as T);
    }

    putEventState(options: PutEventStateOptions) {
        const mode = options.mode || 'put';
        if (mode === 'put') {
            for (const feature of this.shownFeatures.features) {
                if (feature.properties?.eventState === options.state) {
                    delete feature.properties.eventState;
                }
            }
        }

        const feature = this.shownFeatures.features[options.index];
        if (feature) {
            feature.properties = { ...feature.properties, eventState: options.state };
        }

        if (options.show !== false) {
            this.show(this.shownFeatures);
        }
    }

    cleanEventState(options: CleanEventStateOptions) {
        const feature = this.shownFeatures.features[options.index];
        if (feature?.properties?.eventState) {
            delete feature?.properties?.eventState;
            if (options?.show !== false) {
                this.show(this.shownFeatures);
            }
        }
    }

    cleanEventStates(options?: CleanEventStatesOptions) {
        let changed = false;
        for (const feature of this.shownFeatures.features) {
            if (!options?.states || options.states.includes(feature.properties?.eventState)) {
                delete feature.properties?.eventState;
                changed = true;
            }
        }

        if (options?.show !== false && changed) {
            this.show(this.shownFeatures);
        }
    }
}
