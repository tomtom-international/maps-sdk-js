import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { Feature, FeatureCollection, Position } from "geojson";
import { AbstractMapModule, GeoJSONSourceWithLayers, MapModuleConfig } from "../core";
import { locationGeometryFillSpec, locationGeometryOutlineSpec } from "./layers/GeometryLayers";

export const geometrySourceID = "LOCATION_GEOMETRY";
const locationGeometryFillId = "LOCATION_GEOMETRY_FILL";
const locationGeometryOutlineId = "LOCATION_GEOMETRY_OUTLINE";

const worldBBoxPolygon: Position[] = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90]
];

const featureCollection = <T extends FeatureCollection>(features: Feature[]): T =>
    ({
        type: "FeatureCollection",
        features
    } as T);

const reversePolygon = (coords: Position[][]): Position[][] => coords.map((coord) => coord.reverse()).reverse();

const invert = (geometry: GeometryDataResponse): GeometryDataResponse => {
    const feature = geometry.features?.[0];
    // This logic is a simplification of using: { turf.difference(turf.bboxPolygon([-180, 90, 180, -90]), feature) }
    const reversedPolygon =
        feature.geometry.type === "Polygon"
            ? reversePolygon(feature.geometry.coordinates)
            : feature.geometry.coordinates.flatMap((polygonCoords) => reversePolygon(polygonCoords));

    return featureCollection([
        {
            ...feature,
            geometry: {
                type: "Polygon",
                coordinates: [worldBBoxPolygon, ...reversedPolygon]
            }
        }
    ]);
};

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<MapModuleConfig> {
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
     * @param inverted - Reverse polygon
     */
    show(geometry: GeometryDataResponse, inverted = true): void {
        this.callWhenMapReady(() => this.geometry?.show(inverted ? invert(geometry) : geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.geometry?.clear());
    }
}
