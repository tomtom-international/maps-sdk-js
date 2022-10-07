import { BackgroundLayerSpecification, LayerSpecification } from "maplibre-gl";

/**
 * Layer specification that supports a data source.
 * @ignore
 */
export type LayerSpecWithSource = Exclude<LayerSpecification, BackgroundLayerSpecification>;

/**
 * GO SDK layer specifications do not come with the source ID initialized yet.
 * @ignore
 */
export type GOSDKLayerSpec = Omit<LayerSpecification, "source">;

/**
 * Function signature to filter layers.
 * @ignore
 */
export type LayerSpecFilter = (layerSpec: LayerSpecification) => boolean;
