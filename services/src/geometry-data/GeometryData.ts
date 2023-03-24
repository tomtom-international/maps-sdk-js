import { CommonPlaceProps, Geometries, Places } from "@anw/maps-sdk-js/core";
import { GeometryDataParams } from "./types/GeometryDataParams";
import { geometryDataTemplate, GeometryDataTemplate } from "./GeometryDataTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 * The Geometries Data service returns sets of coordinates that represent the outline of a city, country, or land area.
 * * The service supports batch requests of up to 20 identifiers.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/additional-data-service/additional-data
 */
export const geometryData = async (
    params: GeometryDataParams,
    customTemplate?: Partial<GeometryDataTemplate>
): Promise<Geometries> => {
    return callService(params, { ...geometryDataTemplate, ...customTemplate }, "GeometryData");
};

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
 * Build geometry data with places properties
 * Use the geometryData service.
 * @param places
 */
export const placeGeometryData = async (
    places: Places,
    params?: GeometryDataParams
): Promise<Geometries<CommonPlaceProps>> => {
    const geometries = await geometryData({ ...params, geometries: places });
    return mergePlacesWithGeometries(places, geometries);
};
