import type { Places, SearchPlaceProps } from '@cet/maps-sdk-js/core';
import type { SearchSummary } from '../../shared';

/**
 * Response from a geometry search query.
 *
 * Contains places found within or along a specified geometry (polygon or circle),
 * along with summary information about the search results.
 *
 * @remarks
 * **Use Cases:**
 * - Find POIs within a delivery zone
 * - Search along a route corridor
 * - Discover places within a custom boundary
 * - Find facilities within a service area
 * - Search within administrative boundaries
 *
 * **Supported Geometries:**
 * - Polygon: Search within a multi-sided boundary
 * - Circle: Search within a radius around a point
 *
 * @example
 * ```typescript
 * const response: GeometrySearchResponse = {
 *   type: 'FeatureCollection',
 *   features: [
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Point', coordinates: [4.9, 52.3] },
 *       properties: {
 *         type: 'POI',
 *         poi: { name: 'Restaurant', categories: ['RESTAURANT'] },
 *         address: { streetName: 'Main Street' },
 *         score: 0.95
 *       }
 *     }
 *   ],
 *   summary: {
 *     numResults: 1,
 *     query: 'restaurant',
 *     queryTime: 45
 *   }
 * };
 * ```
 *
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchResponse = Places<SearchPlaceProps, GeometrySearchFeatureCollectionProps>;

/**
 * Properties attached to the geometry search feature collection.
 *
 * Contains summary information about the search operation and its results.
 *
 * @remarks
 * Provides metadata about:
 * - Number of results found
 * - Query that was executed
 * - Performance metrics
 * - Fuzzy matching level applied
 *
 * @example
 * ```typescript
 * const collectionProps: GeometrySearchFeatureCollectionProps = {
 *   numResults: 25,
 *   query: 'coffee shop',
 *   queryTime: 123,
 *   fuzzyLevel: 1
 * };
 * ```
 *
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchFeatureCollectionProps = SearchSummary;
