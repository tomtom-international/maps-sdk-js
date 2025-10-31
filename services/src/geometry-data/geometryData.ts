import type { CommonPlaceProps, Places, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { GeometryDataTemplate } from './geometryDataTemplate';
import { geometryDataTemplate } from './geometryDataTemplate';
import type { GeometryDataParams, GeometryParams, GeometryPlaceParams } from './types/geometryDataParams';

/**
 * Merge our internal Places "properties" response with Geometry data
 * @param places
 * @param geometries
 * @returns FeatureCollection<Polygon | MultiPolygon>,
 */
const mergePlacesWithGeometries = (places: Places, geometries: PolygonFeatures): PolygonFeatures<CommonPlaceProps> => {
    const placesIdMap = places.features.reduce(
        (acc, place) => {
            const geometryId = place.properties.dataSources?.geometry?.id;

            if (geometryId) {
                acc[geometryId] = {
                    ...place.properties,
                    placeCoordinates: place.geometry.coordinates,
                };
            }
            return acc;
        },
        {} as Record<string, unknown>,
    );

    const features = geometries.features.map((feature) => {
        if (feature.id && placesIdMap[feature.id]) {
            return { ...feature, properties: placesIdMap[feature.id] };
        }

        return feature;
    });

    return {
        type: 'FeatureCollection',
        bbox: geometries.bbox,
        features,
    } as PolygonFeatures<CommonPlaceProps>;
};

/**
 * Retrieve polygon geometries representing geographic area boundaries.
 *
 * The Geometry Data service returns coordinate sets that define the outlines of
 * geographic areas such as cities, countries, administrative regions, or POI footprints.
 * These polygons enable visualization of area boundaries, spatial analysis, and
 * geofencing applications.
 *
 * @remarks
 * Key features:
 * - **Batch requests**: Fetch up to 20 geometries in a single call
 * - **Multiple scales**: From countries down to building footprints
 * - **Place integration**: Can merge with place data for enriched results
 * - **Standard GeoJSON**: Returns standard Polygon/MultiPolygon features
 *
 * Common use cases:
 * - Display city or country boundaries on maps
 * - Show POI building footprints
 * - Create geofences for spatial queries
 * - Visualize administrative divisions
 * - Calculate areas and spatial relationships
 *
 * @param params - Geometry parameters with IDs or places to fetch boundaries for
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to polygon features representing area boundaries
 *
 * @example
 * ```typescript
 * // Fetch geometry by ID
 * const cityBoundary = await geometryData({
 *   key: 'your-api-key',
 *   geometries: ['geometry-id-123']
 * });
 *
 * // Fetch multiple geometries at once
 * const boundaries = await geometryData({
 *   key: 'your-api-key',
 *   geometries: ['country-id-1', 'city-id-2', 'poi-id-3']
 * });
 *
 * // Fetch and merge with place data
 * const searchResults = await search({ query: 'Amsterdam' });
 * const withBoundaries = await geometryData({
 *   key: 'your-api-key',
 *   geometries: searchResults  // Places with geometry IDs
 * });
 * // Result includes both place properties and polygon boundaries
 * ```
 *
 * @see [Geometry Data API Documentation](https://docs.tomtom.com/search-api/documentation/additional-data-service/additional-data)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Geometry Data Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/geometry-data)
 *
 * @group Geometry
 */
export async function geometryData(
    params: GeometryDataParams,
    customTemplate?: Partial<GeometryDataTemplate>,
): Promise<PolygonFeatures>;
export async function geometryData(
    params: GeometryPlaceParams,
    customTemplate?: Partial<GeometryDataTemplate>,
): Promise<PolygonFeatures<CommonPlaceProps>>;
export async function geometryData(params: GeometryParams, customTemplate?: Partial<GeometryDataTemplate>) {
    const geometryResult = await callService(params, { ...geometryDataTemplate, ...customTemplate }, 'GeometryData');

    // If params.geometries is a FeatureCollection(Place), the properties will be merged with geometry results.
    if (!Array.isArray(params.geometries) && params.geometries.type === 'FeatureCollection') {
        return mergePlacesWithGeometries(params.geometries, geometryResult);
    }

    return geometryResult;
}
