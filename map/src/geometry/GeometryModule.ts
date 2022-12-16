import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers } from "../core";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";
import { asDefined } from "../core/AssertionUtils";

export const GEOMETRY_SOURCE_ID = "PLACE_GEOMETRY";
const GEOMETRY_FILL_LAYER_ID = "PLACE_GEOMETRY_FILL";
const GEOMETRY_OUTLINE_LAYER_ID = "PLACE_GEOMETRY_OUTLINE";

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleConfig> {
    private geometry?: GeoJSONSourceWithLayers<GeometryDataResponse>;

    init(): void {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID },
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID }
        ]);
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     */
    show(geometry: GeometryDataResponse): void {
        this.callWhenMapReady(() => asDefined(this.geometry).show(geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => asDefined(this.geometry).clear());
    }
}
