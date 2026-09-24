import type { HasBBox } from '@tomtom-org/maps-sdk/core';
import type { SearchGeometryInput } from '../../geometry-search';
import type { CommonGeocodeAndFuzzySearchParams, CommonSearchParams, PointGeoBias } from '../../shared';
import type { AreaTag } from './areaTags';
import type { ExplorationSearchRequestAPI } from './explorationSearchRequestAPI';
import type { ExplorationSearchResponseAPI } from './explorationSearchResponseAPI';

/**
 * Record types the exploration search can return — POIs, standalone point
 * addresses, and street records. Matches the API's `types` filter vocabulary.
 *
 * @ignore
 * @experimental
 */
export type ExplorationRecordType = 'POI' | 'PointAddress' | 'Street';

/**
 * Parameters for the exploration search service.
 *
 * Mirrors the input surface of the existing {@link search} service, with two
 * extra filters exposed by the exploration places API (`municipalities` and
 * `geometries`).
 *
 * @remarks
 * **Mapping to the places API body:**
 * - `query` → `q`
 * - `countries[0]` → `country`
 * - `poiBrands[0]` → `brand`
 * - `poiCategories` → `categories` (mapped to TomTom numeric category ids)
 * - `geoBias` → `near.coordinates` + `near.radius_km`
 * - `boundingBoxes` → `bboxes`
 * - `geometries` → `geometries` (Polygon/MultiPolygon passed through; Circle
 *   buffered to a Polygon; FeatureCollection flattened to its features)
 * - `municipalities` → `municipalities`
 * - `areaId` → `area_id`
 * - `areaTags` → `area_tags`
 * - `offset` → `from`
 * - `limit` → `size`
 *
 * @ignore
 * @experimental
 */
export type ExplorationSearchParams = CommonSearchParams<ExplorationSearchRequestAPI, ExplorationSearchResponseAPI> &
    Omit<CommonGeocodeAndFuzzySearchParams, 'geoBias'> & {
        /**
         * The point to search around, and how far. Unlike the other search services, this endpoint
         * takes a point and {@link boundingBoxes} as separate filters, so both may be given.
         */
        geoBias?: PointGeoBias;

        /**
         * Exact, case-sensitive municipality/city filters (e.g. `['Amsterdam', 'Utrecht']`).
         */
        municipalities?: string[];

        /**
         * Bounding boxes to restrict results to, sent as the API's `bboxes` array.
         */
        boundingBoxes?: HasBBox[];

        /**
         * Geometries to constrain results to. Accepts the same input shapes as
         * {@link GeometrySearchParams.geometries} — `Polygon`, `MultiPolygon`,
         * `Circle`, or `PolygonFeatures`. POIs whose position lies inside any
         * provided shape are returned.
         *
         * Circles are buffered into polygons before being sent to the API.
         */
        geometries?: SearchGeometryInput[];

        /**
         * Restrict the response to specific record types. Defaults to all types.
         *
         * - `'POI'` — points of interest (businesses, landmarks, amenities)
         * - `'PointAddress'` — standalone street addresses with building numbers
         * - `'Street'` — street records (no building number)
         *
         * Example: `placeTypes: ['POI', 'PointAddress']` to exclude Street records.
         */
        placeTypes?: ExplorationRecordType[];

        /**
         * Exact id of a municipality polygon — restricts results to places that
         * sit inside that municipality. Typically populated from the `areaId`
         * of a previous hit ("what else is in this same area?"). Efficient
         * terms-only lookup, no spatial query required.
         */
        areaId?: string;

        /**
         * Area-character tokens describing the surrounding municipality
         * (`coastal`, `walkable`, `alpine`, `transit_connected`, …). Matches
         * places in any municipality tagged with ANY of the supplied tokens
         * (OR semantics). Populated for `DE` / `NL` / `FR` only — supplying
         * tags in other countries will return zero hits.
         *
         * Typed against {@link AreaTag} — autocompletes on the canonical
         * vocabulary but tolerates new tokens added in a future pipeline
         * run without a wire-protocol change.
         */
        areaTags?: AreaTag[];
    };
