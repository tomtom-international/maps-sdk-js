/**
 * @module agent-toolkit-state
 *
 * Default MapLibre layer specs the BYOD slice picks when the caller does not
 * supply layers explicitly. The slice inspects the entry's geometry types and
 * picks one layer per kind present (circle / line / fill). Mixed-kind entries
 * get all three stacked. The defaults are intentionally subtle (low opacity,
 * stable theme-neutral colour) so they read as "the agent's data" rather than
 * competing with TomTom's own layers — the integrator can always override.
 */

import type { CustomGeoJSONLayerSpec } from '@tomtom-org/maps-sdk/map';
import type { FeatureCollection } from 'geojson';

const POINT_LAYER: CustomGeoJSONLayerSpec = {
    type: 'circle',
    paint: {
        'circle-radius': 4,
        'circle-color': '#0a3653',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
    },
};

const LINE_LAYER: CustomGeoJSONLayerSpec = {
    type: 'line',
    paint: {
        'line-color': '#0a3653',
        'line-width': 2,
    },
};

const FILL_LAYER: CustomGeoJSONLayerSpec = {
    type: 'fill',
    paint: {
        'fill-color': '#0a3653',
        'fill-opacity': 0.25,
        'fill-outline-color': '#0a3653',
    },
};

type GeomKind = 'point' | 'line' | 'polygon';

// Map every GeoJSON geometry-type string to its display kind. Cheaper than an
// if/else-if cascade and trivially extended; `GeometryCollection` is handled
// separately at the call site because it nests further geometries.
const KIND_BY_TYPE: Record<string, GeomKind> = {
    Point: 'point',
    MultiPoint: 'point',
    LineString: 'line',
    MultiLineString: 'line',
    Polygon: 'polygon',
    MultiPolygon: 'polygon',
};

const classify = (data: FeatureCollection): Set<GeomKind> => {
    const kinds = new Set<GeomKind>();
    for (const feature of data.features) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        if (geometry.type === 'GeometryCollection') {
            for (const inner of geometry.geometries) {
                const kind = KIND_BY_TYPE[inner.type];
                if (kind) kinds.add(kind);
            }
            continue;
        }
        const kind = KIND_BY_TYPE[geometry.type];
        if (kind) kinds.add(kind);
    }
    return kinds;
};

/**
 * Pick sensible default MapLibre layer specs for the given FeatureCollection.
 * For polygon-first overlays the fill comes before the line so the outline
 * sits on top; otherwise the order is fill → line → circle so points stack
 * above areas.
 *
 * @ignore
 */
export const defaultLayersFor = (data: FeatureCollection): CustomGeoJSONLayerSpec[] => {
    const kinds = classify(data);
    const layers: CustomGeoJSONLayerSpec[] = [];
    if (kinds.has('polygon')) layers.push(FILL_LAYER);
    if (kinds.has('line')) layers.push(LINE_LAYER);
    if (kinds.has('point')) layers.push(POINT_LAYER);
    // Empty / unknown geometry → fall back to a circle layer; the source will
    // be empty so nothing renders, but the module still needs at least one layer.
    if (layers.length === 0) layers.push(POINT_LAYER);
    return layers;
};
