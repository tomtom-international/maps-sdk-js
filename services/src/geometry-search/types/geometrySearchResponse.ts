import type { Places, SearchPlaceProps } from '@anw/maps-sdk-js/core';
import type { SearchSummary } from '../../shared';

export type GeometrySearchResponse = Places<SearchPlaceProps, GeometrySearchFeatureCollectionProps>;

export type GeometrySearchFeatureCollectionProps = SearchSummary;
