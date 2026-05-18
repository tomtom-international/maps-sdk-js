import type { AddressProperties, Places, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { SearchSummary } from '../../shared';
import type { AreaTag } from './areaTags';

/**
 * Additional properties exposed on each feature in an exploration search
 * response. The places-api propagates "area" metadata from the municipality
 * polygon each hit sits in (currently populated for `DE` / `NL` / `FR`); the
 * SDK surfaces those fields alongside the standard {@link SearchPlaceProps}.
 *
 * The `address` is widened from the SDK's standard {@link AddressProperties}
 * to also expose the optional `entryPoint` string the places-api emits on
 * `PointAddress` records.
 *
 * @ignore
 * @experimental
 */
export type ExplorationPlaceProps = Omit<SearchPlaceProps, 'address'> & {
    address: AddressProperties & { entryPoint?: string };
    /**
     * Id of the municipality polygon this hit sits inside. Round-trips into
     * `areaId` on a subsequent request to fetch every other place in the
     * same municipality.
     */
    areaId?: string;
    /**
     * ISO 3166-1 alpha-2 country code of the hit's municipality polygon.
     */
    areaCountry?: string;
    /**
     * Area-character tokens describing the surrounding municipality
     * (e.g. `coastal`, `walkable`, `transit_connected`).
     *
     * Typed against {@link AreaTag} for editor autocompletion on the
     * canonical vocabulary; arbitrary strings stay compatible to
     * tolerate future pipeline-run additions.
     */
    areaTags?: AreaTag[];
};

/**
 * Response from the exploration search service.
 *
 * Matches the shape produced by {@link search} — a `FeatureCollection` of
 * place features with search-specific properties (`score`, `distance`) and a
 * {@link SearchSummary} on the collection — extended with the
 * exploration-specific `areaId` / `areaCountry` / `areaTags` fields on each
 * feature.
 *
 * @ignore
 * @experimental
 */
export type ExplorationSearchResponse = Places<ExplorationPlaceProps, SearchSummary>;
