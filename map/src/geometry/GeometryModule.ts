import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { Feature, FeatureCollection, Position } from "geojson";
import isNil from "lodash/isNil";
import { AbstractMapModule, GeoJSONSourceWithLayers } from "../core";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";

export const geometrySourceID = "PLACE_GEOMETRY";
const geometryFillLayerId = "PLACE_GEOMETRY_FILL";
const geometryOutlineLayerId = "PLACE_GEOMETRY_OUTLINE";

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

const reversePolygon = (multiCoords: Position[][]): Position[][] =>
    multiCoords.map((coords) => [...coords].reverse()).reverse();

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
        const mergedConfig = this.getMergedConfig(config);
        const inverted = isNil(mergedConfig?.inverted) ? true : mergedConfig?.inverted;
        this.callWhenMapReady(() => this.geometry?.show(inverted ? invert(geometry) : geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.geometry?.clear());
    }
}
