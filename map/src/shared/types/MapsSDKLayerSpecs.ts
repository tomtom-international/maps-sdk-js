import { BackgroundLayerSpecification, LayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { GeoJSONSourceWithLayers, StyleSourceWithLayers } from "../SourceWithLayers";
import { mapStyleLayerIDs } from "../layers/layerIDs";

/**
 * Layer specification that supports a data source.
 * @ignore
 */
export type LayerSpecWithSource = Exclude<LayerSpecification, BackgroundLayerSpecification>;

/**
 * Layer to be added to the existing style, and may include extra config such as the ID of the layer to add it under.
 * * e.g. GeoJSON layers.
 * @ignore
 */
export type ToBeAddedLayerSpec<L extends LayerSpecification = LayerSpecification> = L & {
    /**
     * The ID of an existing layer to insert the new layer before,
     * resulting in the new layer appearing visually beneath the existing layer.
     * If this argument is not specified, the layer will be appended to the end of the layers array
     * and appear visually above all other layers.
     * @see Map.addLayer
     */
    beforeID?: string;
};

/**
 * TomTom Maps SDK layer specifications do not come with the source ID initialized yet.
 * @ignore
 */
export type ToBeAddedLayerSpecWithoutSource<L extends LayerSpecification = LayerSpecification> = Omit<
    ToBeAddedLayerSpec<L>,
    "source"
>;

/**
 * TomTom Maps SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type LayerSpecTemplate<L extends LayerSpecification> = Omit<L, "id" | "source">;

/**
 * @ignore
 */
export type SymbolLayerSpecWithoutSource = Omit<SymbolLayerSpecification, "source">;

/**
 * Function signature to filter layers.
 * @ignore
 */
export type LayerSpecFilter = (layerSpec: LayerSpecification) => boolean;

/**
 * TomTom Maps SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type SourceWithLayers = StyleSourceWithLayers | GeoJSONSourceWithLayers;

/**
 * @ignore
 */
export type SourcesWithLayers = { [name: string]: SourceWithLayers };

/**
 * Contains the IDs of a source and its related layers.
 * * Using source and layer ids you can customize them using MapLibre.
 */
export type SourceWithLayerIDs = {
    sourceID: string;
    layerIDs: string[];
};

/**
 * Known layer ID from the TomTom map style.
 */
export type MapStyleLayerID = keyof typeof mapStyleLayerIDs;
