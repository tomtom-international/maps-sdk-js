/**
 * @module agent-toolkit-tools
 *
 * Compact schema doc for the `geometries` array consumed/produced by sandboxed
 * code in `processData` / `analyseData`. Each item is a
 * `PolygonFeature<CommonPlaceProps>`; only the non-GeoJSON-standard bits are
 * spelled out here.
 */

/** @ignore */
export const GEOMETRIES_SCHEMA_DOC =
    '`geometries` is an array of Polygon/MultiPolygon Features. Each has `id` (the geometry-data-source id, ' +
    'matches `place.properties.dataSources.geometry.id`) and `bbox`. `properties` varies by source — see ' +
    '`GEOMETRIES_PROPS_DOC`. Use `turf.area`, `turf.union`, `turf.intersect`, `turf.bbox`, `turf.centroid`, ' +
    '`turf.buffer`, … directly on these features. For h3, convert via `h3.polygonToCells(feature.geometry.coordinates, res)`.';
