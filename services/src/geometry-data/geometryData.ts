import { CommonPlaceProps, PolygonFeatures, Places } from "@anw/maps-sdk-js/core";
import { GeometryDataParams, GeometryParams, GeometryPlaceParams } from "./types/geometryDataParams";
import { GeometryDataTemplate, geometryDataTemplate } from "./geometryDataTemplate";
import { callService } from "../shared/serviceTemplate";

/**
 * Merge our internal Places "properties" response with Geometry data
 * @param places
 * @param geometries
 * @returns FeatureCollection<Polygon | MultiPolygon>,
 */
const mergePlacesWithGeometries = (places: Places, geometries: PolygonFeatures): PolygonFeatures<CommonPlaceProps> => {
    const placesIdMap = places.features.reduce((acc, place) => {
        const geometryId = place.properties.dataSources?.geometry?.id;

        if (geometryId) {
            acc[geometryId] = {
                ...place.properties,
                placeCoordinates: place.geometry.coordinates
            };
        }
        return acc;
    }, {} as Record<string, unknown>);

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
    } as PolygonFeatures<CommonPlaceProps>;
};

/**
 * The PolygonFeatures Data service returns sets of coordinates that represent the outline of a city, country, or land area.
 * * The service supports batch requests of up to 20 identifiers.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/additional-data-service/additional-data
 */
export async function geometryData(
    params: GeometryDataParams,
    customTemplate?: Partial<GeometryDataTemplate>
): Promise<PolygonFeatures>;
export async function geometryData(
    params: GeometryPlaceParams,
    customTemplate?: Partial<GeometryDataTemplate>
): Promise<PolygonFeatures<CommonPlaceProps>>;
export async function geometryData(params: GeometryParams, customTemplate?: Partial<GeometryDataTemplate>) {
    const geometryResult = await callService(params, { ...geometryDataTemplate, ...customTemplate }, "GeometryData");

    // If params.geometries is a FeatureCollection(Place), the properties will be merged with geometry results.
    if (!Array.isArray(params.geometries) && params.geometries.type === "FeatureCollection") {
        return mergePlacesWithGeometries(params.geometries, geometryResult);
    }

    return geometryResult;
}
