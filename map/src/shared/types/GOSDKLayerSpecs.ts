import { FeatureCollection } from "geojson";
import { BackgroundLayerSpecification, LayerSpecification } from "maplibre-gl";
import { GeoJSONSourceWithLayers, StyleSourceWithLayers } from "../SourceWithLayers";

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
 * GO SDK layer specifications do not come with the source ID initialized yet.
 * @ignore
 */
export type ToBeAddedLayerSpecWithoutSource<L extends LayerSpecification = LayerSpecification> = Omit<
    ToBeAddedLayerSpec<L>,
    "source"
>;

/**
 * GO SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type LayerSpecTemplate<L extends LayerSpecification> = Omit<L, "id" | "source">;

/**
 * Function signature to filter layers.
 * @ignore
 */
export type LayerSpecFilter = (layerSpec: LayerSpecification) => boolean;

/**
 * GO SDK layer specifications template, without ID nor source, to be still initialized in some map module.
 * @ignore
 */
export type SourceWithLayers = StyleSourceWithLayers | GeoJSONSourceWithLayers<FeatureCollection>;
