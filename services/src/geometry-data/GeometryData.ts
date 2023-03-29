import { CommonPlaceProps, Geometries, Places } from "@anw/maps-sdk-js/core";
import { GeometryDataParams, GeometryParams, GeometryPlaceParams } from "./types/GeometryDataParams";
import { geometryDataTemplate } from "./GeometryDataTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 * Merge our internal Places "properties" response with Geometry data
 * @param places
 * @param geometries
 * @returns FeatureCollection<Polygon | MultiPolygon>,
 */
const mergePlacesWithGeometries = (places: Places, geometries: Geometries): Geometries<CommonPlaceProps> => {
    const placesIdMap = places.features.reduce((acc, place) => {
        const geometryId = place.properties.dataSources?.geometry?.id;

        if (geometryId) {
            acc[geometryId] = {
                ...place.properties,
                placeCoordinates: place.geometry.coordinates
            };
        }
        return acc;
    }, {} as Record<string, any>);

    const features = geometries.features.map((feature) => {
        if (feature.id && placesIdMap[feature.id]) {
            return { ...feature, properties: placesIdMap[feature.id] };
        }

        return feature;
    });

    return {
        type: "FeatureCollection",
        bbox: geometries.bbox,
        features
    };
};

/**
 * The Geometries Data service returns sets of coordinates that represent the outline of a city, country, or land area.
 * * The service supports batch requests of up to 20 identifiers.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/additional-data-service/additional-data
 */
export async function geometryData(
    params: GeometryDataParams,
    customTemplate?: Partial<GeometryDataParams>
): Promise<Geometries>;
export async function geometryData(
    params: GeometryPlaceParams,
    customTemplate?: Partial<GeometryDataParams>
): Promise<Geometries<CommonPlaceProps>>;
export async function geometryData(params: GeometryParams, customTemplate?: Partial<GeometryDataParams>) {
    const geometryResult = await callService(params, { ...geometryDataTemplate, ...customTemplate }, "GeometryData");

    // If params.geometries is a FeatureCollection(Place), the properties will be merge with geometry results.
    if (!Array.isArray(params.geometries) && params.geometries.type === "FeatureCollection") {
        return mergePlacesWithGeometries(params.geometries, geometryResult);
    }

    return geometryResult;
}
