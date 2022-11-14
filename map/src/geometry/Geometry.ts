import difference from "@turf/difference";
import bboxPolygon from "@turf/bbox-polygon";
import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers, MapModuleConfig } from "../core";
import { locationGeometryFillSpec, locationGeometryOutlineSpec } from "./layers/GeometryLayers";
import { Feature, FeatureCollection } from "geojson";

export const geometrySourceID = "LOCATION_GEOMETRY";
const locationGeometryFillId = "LOCATION_GEOMETRY_FILL";
const locationGeometryOutlineId = "LOCATION_GEOMETRY_OUTLINE";

const featureCollection = <T extends FeatureCollection>(features: Feature[]): T =>
    ({
        type: "FeatureCollection",
        features
    } as T);

const reverse = (geometry: GeometryDataResponse): GeometryDataResponse => {
    const feature = geometry.features?.[0];
    const invertedMultiPolygon = difference(bboxPolygon([-180, 90, 180, -90]), feature);
    if (invertedMultiPolygon) {
        return featureCollection([invertedMultiPolygon]);
    } else {
        return featureCollection([]);
    }
};

/**
 * Geometry data module.
 */
export class Geometry extends AbstractMapModule<MapModuleConfig> {
    private geometry?: GeoJSONSourceWithLayers<GeometryDataResponse>;

    init(): void {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, geometrySourceID, [
            { ...locationGeometryFillSpec, id: locationGeometryFillId },
            { ...locationGeometryOutlineSpec, id: locationGeometryOutlineId }
        ]);
        this.geometry.ensureAddedToMapWithVisibility(false);
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     * @param reversed - Reverse polygon
     */
    show(geometry: GeometryDataResponse, reversed?: boolean): void {
        this.callWhenMapReady(() => this.geometry?.show(reversed ? reverse(geometry) : geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.geometry?.clear());
    }
}
