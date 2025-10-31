import type { Place, Places } from '@tomtom-org/maps-sdk/core';
import type { CommonServiceParams } from '../../shared';
import type { GeometryDataResponseAPI } from './apiTypes';

/**
 * Geometry IDs as strings.
 *
 * @remarks
 * Geometry IDs are obtained from previous search results or place data that
 * includes geometry data source references.
 *
 * @example
 * ```typescript
 * const ids: GeometriesInput = ['g1234567890', 'g0987654321'];
 * ```
 *
 * @group Geometry
 */
export type GeometriesInput = string[];

/**
 * Common service parameters with zoom configuration.
 *
 * Extended by {@link GeometryDataParams} and {@link GeometryPlaceParams}.
 *
 * @group Geometry
 */
export type CommonServiceParamsWithZoom = CommonServiceParams<URL, GeometryDataResponseAPI> & {
    /**
     * Optional zoom level for geometry detail.
     *
     * @remarks
     * Controls the level of detail in the returned geometry:
     * - Lower zoom (0-5): Simplified geometry for continents/countries
     * - Medium zoom (6-12): Moderate detail for regions/cities
     * - High zoom (13-22): Full detail for neighborhoods/buildings
     *
     * **Recommendations:**
     * - Align with your map's current zoom level
     * - Use lower zoom for large geographies to reduce data size
     * - Essential for performance with very large areas
     *
     * @default undefined (returns highest detail available)
     * @minimum 0
     * @maximum 22
     *
     * @example
     * ```typescript
     * zoom: 10  // City-level detail
     * zoom: 15  // Neighborhood-level detail
     * ```
     */
    zoom?: number;
};

/**
 * Parameters for fetching geometry data by IDs.
 *
 * @remarks
 * Use this when you have geometry IDs from previous API calls and want to
 * fetch the actual polygon/multipolygon coordinates.
 *
 * @example
 * ```typescript
 * // Fetch geometries by ID
 * const params: GeometryDataParams = {
 *   key: 'your-api-key',
 *   geometries: ['g1234567890', 'g0987654321'],
 *   zoom: 12
 * };
 * ```
 *
 * @group Geometry
 */
export type GeometryDataParams = CommonServiceParamsWithZoom & {
    /**
     * Array of geometry IDs to fetch.
     *
     * @remarks
     * **Constraints:**
     * - Minimum: 1 geometry ID
     * - Maximum: 20 geometry IDs per request
     *
     * IDs are obtained from place data sources, typically from search results
     * that include `dataSources.geometry.id`.
     *
     * @example
     * ```typescript
     * // Single geometry
     * geometries: ['g1234567890']
     *
     * // Multiple geometries
     * geometries: ['g1234567890', 'g0987654321', 'g1122334455']
     * ```
     */
    geometries: GeometriesInput;
};

/**
 * Parameters for fetching geometry data from places.
 *
 * @remarks
 * Use this when you have place objects (from search results) and want to
 * fetch their boundaries. The function will automatically extract geometry IDs
 * from the places.
 *
 * @example
 * ```typescript
 * // From search results
 * const searchResults = await search({ query: 'Amsterdam' });
 * const params: GeometryPlaceParams = {
 *   key: 'your-api-key',
 *   geometries: searchResults,
 *   zoom: 10
 * };
 *
 * // From individual places
 * const params: GeometryPlaceParams = {
 *   key: 'your-api-key',
 *   geometries: [place1, place2],
 *   zoom: 12
 * };
 * ```
 *
 * @group Geometry
 */
export type GeometryPlaceParams = CommonServiceParamsWithZoom & {
    /**
     * Places or place array containing geometry IDs.
     *
     * @remarks
     * The places must have geometry data sources with IDs. Places without
     * geometry IDs will be skipped.
     *
     * **Supported Formats:**
     * - Single Place object
     * - Array of Place objects
     * - Places FeatureCollection
     *
     * @example
     * ```typescript
     * // FeatureCollection from search
     * geometries: searchResults
     *
     * // Array of places
     * geometries: [place1, place2, place3]
     * ```
     */
    geometries: Place[] | Places;
};

/**
 * Union type for all geometry data parameter formats.
 *
 * Accepts either geometry IDs directly or places containing geometry IDs.
 *
 * @remarks
 * **Choose the right type:**
 * - {@link GeometryDataParams}: When you have geometry IDs as strings
 * - {@link GeometryPlaceParams}: When you have place objects from search
 *
 * @example
 * ```typescript
 * // Using IDs
 * const idParams: GeometryParams = {
 *   key: 'your-api-key',
 *   geometries: ['g1234567890']
 * };
 *
 * // Using places
 * const placeParams: GeometryParams = {
 *   key: 'your-api-key',
 *   geometries: searchResults
 * };
 * ```
 *
 * @group Geometry
 */
export type GeometryParams = GeometryDataParams | GeometryPlaceParams;
