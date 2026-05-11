/**
 * @module agent-toolkit-tools
 *
 * Compact TypeScript-like schema documentation for the geometry-array shape consumed and produced
 * by the LLM-authored sandbox code in `processGeometries` / `analyseGeometries`. Each polygon is
 * a `PolygonFeature<CommonPlaceProps>` (the same shape `geometryData` returns), so this doc is
 * deliberately small — the per-place properties carry over from `PLACES_SCHEMA_DOC`.
 */

/** @ignore */
export const GEOMETRIES_SCHEMA_DOC =
    'Schema (the `geometries` array shape):\n' +
    '```ts\n' +
    'type Geometry = {                          // a polygon footprint for one place\n' +
    '  type: "Feature";\n' +
    '  id: string;                              // geometry-data-source id (matches place.properties.dataSources.geometry.id)\n' +
    '  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };\n' +
    '  bbox: [minLng, minLat, maxLng, maxLat];\n' +
    '  properties?: { /* place props if available — usually empty here */ };\n' +
    '};\n' +
    'type Geometries = Geometry[];              // ordered list, same length as the input place ids when fully populated\n' +
    '```\n' +
    'Notes: every polygon is a closed GeoJSON ring (last point == first). Use `turf.area`, `turf.union`, ' +
    '`turf.intersect`, `turf.bbox`, `turf.centroid`, `turf.buffer`, etc. directly on these features. ' +
    'For h3 work, convert with `turf.bbox(feature)` → cells, or iterate `feature.geometry.coordinates`.';
