import type { Places, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { SearchSummary } from '../../shared';

/**
 * Response from the exploration search service.
 *
 * Matches the shape produced by {@link search} — a `FeatureCollection` of
 * place features with search-specific properties (`score`, `distance`) and a
 * {@link SearchSummary} on the collection.
 *
 * @ignore
 * @experimental
 */
export type ExplorationSearchResponse = Places<SearchPlaceProps, SearchSummary>;
