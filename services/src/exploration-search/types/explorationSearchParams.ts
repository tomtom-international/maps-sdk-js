import type { HasBBox, HasLngLat } from '@tomtom-org/maps-sdk/core';
import type { SearchGeometryInput } from '../../geometry-search';
import type { CommonGeocodeAndFuzzySearchParams, CommonSearchParams } from '../../shared';
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
 * - `position` + `radiusMeters` → `near.coordinates` + `near.radius_km`
 * - `boundingBox` / `boundingBoxes` → `bboxes`
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
    CommonGeocodeAndFuzzySearchParams & {
        /**
         * Geographic position to restrict results around.
         *
         * Combined with {@link radiusMeters} this maps to the API's `near` filter.
         * Accepts any {@link HasLngLat}-compatible value — a `[lon, lat]` tuple,
         * a GeoJSON `Point`, or a `Feature<Point>`.
         */
        position?: HasLngLat;

        /**
         * Exact, case-sensitive municipality/city filters (e.g. `['Amsterdam', 'Utrecht']`).
         */
        municipalities?: string[];

        /**
         * Additional bounding boxes to restrict results to.
         *
         * Merged with {@link boundingBox} and sent as the API's `bboxes` array.
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
