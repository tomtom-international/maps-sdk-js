import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers } from "../core";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";

export const geometrySourceID = "PLACE_GEOMETRY";
const geometryFillLayerId = "PLACE_GEOMETRY_FILL";
const geometryOutlineLayerId = "PLACE_GEOMETRY_OUTLINE";

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleConfig> {
    private geometry?: GeoJSONSourceWithLayers<GeometryDataResponse>;

    init(): void {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, geometrySourceID, [
            { ...geometryFillSpec, id: geometryFillLayerId },
            { ...geometryOutlineSpec, id: geometryOutlineLayerId }
        ]);
        this.geometry.ensureAddedToMapWithVisibility(false);
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     * @param config - Optional configuration to override the module one.
     */
    show(geometry: GeometryDataResponse, config?: GeometryModuleConfig): void {
        this.callWhenMapReady(() => this.geometry?.show(geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.geometry?.clear());
    }
}
