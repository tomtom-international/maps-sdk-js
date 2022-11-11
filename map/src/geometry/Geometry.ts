import difference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import { featureCollection } from "@turf/helpers";
import { GeometryData } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers, MapModuleConfig } from "../core";
import { locationGeometryFillSpec, locationGeometryOutlineSpec } from "./layers/GeometryLayers";

export const geometrySourceID = "LOCATION_GEOMETRY";
const locationGeometryFillId = "LOCATION_GEOMETRY_FILL";
const locationGeometryOutlineId = "LOCATION_GEOMETRY_OUTLINE";

/**
 * Geometry data module.
 */
export class Geometry extends AbstractMapModule<MapModuleConfig> {
    private geometry?: GeoJSONSourceWithLayers<GeometryData>;

    init(): void {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, geometrySourceID, [
            { ...locationGeometryFillSpec, id: locationGeometryFillId },
            { ...locationGeometryOutlineSpec, id: locationGeometryOutlineId }
        ]);
        this.geometry.ensureAddedToMapWithVisibility(true);
    }

    reverse(geometry: GeometryData): GeometryData {
        const feature = geometry.features?.[0];
        const invertedMultiPolygon = difference(bboxPolygon([-180, 90, 180, -90]), feature);
        if (invertedMultiPolygon) {
            return featureCollection([invertedMultiPolygon]);
        } else {
            return featureCollection([]);
        }
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     * @param reversed - Reverse polygon
     */
    show(geometry: GeometryData, reversed?: boolean): void {
        this.callWhenMapReady(() => this.geometry?.show(reversed ? this.reverse(geometry) : geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.geometry?.clear());
    }
}
