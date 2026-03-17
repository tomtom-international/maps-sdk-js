import type { Places, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { SearchSummary } from '../../shared';

/**
 * Response from an along-route search query.
 *
 * Contains places found near the route, sorted by detour time or offset,
 * along with summary information about the search results.
 *
 * @group Along Route Search
 */
export type AlongRouteSearchResponse = Places<SearchPlaceProps, SearchSummary>;
