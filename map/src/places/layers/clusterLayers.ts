import type { CircleLayerSpecification, ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { baseMapPOICategoryValues } from '../../pois/util/poiCategoryMapping';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import { DEFAULT_BASE_MAP_PLACE_ICON_ID } from '../../shared/layers/symbolLayers';

// Filter that picks cluster features out of a GeoJSON source with `cluster: true`.
// MapLibre adds `point_count` to every cluster feature; using `has` keeps the
// expression decoupled from any particular cluster property name.
const isClusterFilter: ExpressionSpecification = ['has', 'point_count'];

// Filter for individual (non-cluster) features in a clustered source. Used by the
// caller to derive the "main pin" filter when clustering is enabled.
export const isNotClusterFilter: ExpressionSpecification = ['!', isClusterFilter];

/**
 * Cluster property key for the deduplicated comma-separated list of base-map
 * sprite IDs (each leaf's `baseMapIconID`). Single-category clusters carry a
 * single id here — the cluster pin layer's `match` expression picks the
 * matching `poi-<category>` sprite. The presence of a comma in this property
 * is also what {@link isMixedCategoryClusterFilter} keys off to route mixed
 * clusters to the centred badge + count pair instead.
 *
 * @ignore
 */
export const CLUSTER_PROPERTY_BASE_MAP_ICON_IDS = 'clusterBaseMapIconIDs';

/**
 * Source-feature property key carrying each place's base-map sprite id,
 * populated by `preparePlacesForDisplay` when the `pin-clustered` theme is
 * active. The cluster pin (single-category case) reads it via the
 * {@link CLUSTER_PROPERTY_BASE_MAP_ICON_IDS} aggregator.
 *
 * @ignore
 */
export const FEATURE_PROPERTY_BASE_MAP_ICON_ID = 'baseMapIconID';

// Cluster has only one unique base-map sprite among its leaves — i.e. every
// place in the cluster shares a category. Used to gate single-category-only
// renderings (cluster icon, top-right count badge) so mixed clusters fall
// through to the centred badge + count pair.
const isSingleCategoryClusterFilter: ExpressionSpecification = [
    'all',
    isClusterFilter,
    ['==', ['index-of', ',', ['get', CLUSTER_PROPERTY_BASE_MAP_ICON_IDS]], -1],
];

// Cluster contains 2+ unique base-map sprites — flagged by a comma in the
// dedup-concat aggregator. Used to gate the centred badge + count circle.
const isMixedCategoryClusterFilter: ExpressionSpecification = [
    'all',
    isClusterFilter,
    ['>=', ['index-of', ',', ['get', CLUSTER_PROPERTY_BASE_MAP_ICON_IDS]], 0],
];

/**
 * Symbol layer drawing the lone POI category's base-map sprite at the centre
 * of single-category clusters. Mixed clusters skip this layer entirely and
 * surface their count via {@link buildClusterMixedBadgeCircleLayerSpec} +
 * {@link buildClusterMixedCountTextLayerSpec} instead.
 *
 * @ignore
 */
export const buildClusterPinLayerSpec = (): LayerSpecTemplate<SymbolLayerSpecification> => ({
    type: 'symbol',
    filter: isSingleCategoryClusterFilter,
    layout: {
        // Single-category clusters carry exactly one entry in
        // `clusterBaseMapIconIDs`. We map it to a literal `image()` arm via
        // {@link buildKnownBaseMapSpriteImageExpr} so MapLibre statically
        // pre-loads every possible base-map sprite into the atlas — without
        // that enumeration, dynamic image references render as blanks.
        'icon-image': buildKnownBaseMapSpriteImageExpr(['get', CLUSTER_PROPERTY_BASE_MAP_ICON_IDS]),
        // Constant 1.0 — the cluster icon stays the same on-screen size at
        // every zoom level so users can rely on a stable hit target while
        // panning/zooming. The pin theme's per-place sprites still scale via
        // `PIN_ICON_SIZE`; only the cluster pin is fixed.
        'icon-size': 1,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
    },
});

// Translate (in viewport pixels) that places the count badge at the
// top-right edge of the single-category cluster icon. The cluster icon is
// anchored 'center' at viewport (0, 0), so [12, -14] tucks the badge above
// and to the right of it without obscuring the icon.
const SINGLE_BADGE_TRANSLATE: [number, number] = [12, -14];

// Radius of the small top-right badge for single-category clusters.
const SINGLE_BADGE_RADIUS = 11;

// Radius of the centred badge that occupies a mixed cluster's pin slot. Larger
// than the single-category corner badge because there's no icon behind it —
// the circle itself is the visual.
const MIXED_BADGE_RADIUS = 15;

/**
 * Black circle drawn at the top-right corner of single-category clusters.
 * Background for {@link buildClusterCountTextLayerSpec}; mixed clusters use
 * {@link buildClusterMixedBadgeCircleLayerSpec} instead.
 *
 * @ignore
 */
export const buildClusterBadgeCircleLayerSpec = (): LayerSpecTemplate<CircleLayerSpecification> => ({
    type: 'circle',
    filter: isSingleCategoryClusterFilter,
    paint: {
        'circle-radius': SINGLE_BADGE_RADIUS,
        'circle-color': '#000000',
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1.5,
        'circle-translate': SINGLE_BADGE_TRANSLATE,
        'circle-translate-anchor': 'viewport',
    },
});

/**
 * Symbol layer rendering the cluster count on top of the top-right badge
 * (single-category clusters). Mixed clusters use
 * {@link buildClusterMixedCountTextLayerSpec}.
 *
 * @ignore
 */
export const buildClusterCountTextLayerSpec = (): LayerSpecTemplate<SymbolLayerSpecification> => ({
    type: 'symbol',
    filter: isSingleCategoryClusterFilter,
    layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': [MAP_BOLD_FONT],
        'text-size': 12,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
    },
    paint: {
        'text-color': '#FFFFFF',
        'text-translate': SINGLE_BADGE_TRANSLATE,
        'text-translate-anchor': 'viewport',
    },
});

/**
 * Centred count circle for mixed-category clusters — replaces the cluster
 * icon entirely. {@link buildClusterMixedCountTextLayerSpec} renders the
 * count on top.
 *
 * @ignore
 */
export const buildClusterMixedBadgeCircleLayerSpec = (): LayerSpecTemplate<CircleLayerSpecification> => ({
    type: 'circle',
    filter: isMixedCategoryClusterFilter,
    paint: {
        'circle-radius': MIXED_BADGE_RADIUS,
        'circle-color': '#000000',
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1.5,
    },
});

/**
 * Cluster count rendered on top of the centred badge for mixed-category
 * clusters. Mirrors {@link buildClusterCountTextLayerSpec} but with no
 * translate, so it lands inside the centred badge from
 * {@link buildClusterMixedBadgeCircleLayerSpec}.
 *
 * @ignore
 */
export const buildClusterMixedCountTextLayerSpec = (): LayerSpecTemplate<SymbolLayerSpecification> => ({
    type: 'symbol',
    filter: isMixedCategoryClusterFilter,
    layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': [MAP_BOLD_FONT],
        'text-size': 12,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
    },
    paint: {
        'text-color': '#FFFFFF',
    },
});

/**
 * `clusterProperties` aggregator that exposes a deduplicated, comma-separated
 * list of source-feature property values on every generated cluster.
 *
 * @remarks
 * Uses MapLibre's advanced `[reduceExpression, mapExpression]` form: the map
 * expression extracts the value from each clustered feature; the reduce
 * expression appends it to the running accumulator only when not already
 * present (membership test via `index-of` over `,acc,` ↔ `,current,`).
 *
 * @ignore
 */
const buildDeduplicatedConcatAggregator = (sourceProperty: string, outputProperty: string) => [
    [
        'case',
        ['==', ['get', outputProperty], null],
        ['accumulated'],
        ['==', ['accumulated'], null],
        ['get', outputProperty],
        ['>=', ['index-of', ['concat', ',', ['get', outputProperty], ','], ['concat', ',', ['accumulated'], ',']], 0],
        ['accumulated'],
        ['concat', ['accumulated'], ',', ['get', outputProperty]],
    ],
    ['get', sourceProperty],
];

/**
 * `clusterProperties` map for clustered places sources. Aggregates a
 * deduplicated, comma-separated list of base-map sprite IDs
 * (`baseMapIconID` per leaf) onto every cluster feature, feeding the
 * cluster pin's single-vs-mixed `match` expression and the
 * single/mixed cluster filters.
 *
 * @ignore
 */
export const clusteredPlacesAggregateProperties = {
    [CLUSTER_PROPERTY_BASE_MAP_ICON_IDS]: buildDeduplicatedConcatAggregator(
        FEATURE_PROPERTY_BASE_MAP_ICON_ID,
        CLUSTER_PROPERTY_BASE_MAP_ICON_IDS,
    ),
};

// Wrap a dynamic sprite-name expression in a `match` whose arms statically
// enumerate every known `poi-<category>` sprite. Each arm returns
// `image(literal)`, which MapLibre walks at style-parse time to enumerate
// sprite usages and pre-load them into the atlas. Without this enumeration
// the dynamic value resolves to a missing image at render time and nothing
// shows.
//
// The default arm falls back to `DEFAULT_BASE_MAP_PLACE_ICON_ID` (the same
// fallback the `base-map` theme uses for unmapped places); callers should
// gate the layer with a filter so the default never fires for valid input.
const buildKnownBaseMapSpriteImageExpr = (dynamicNameExpr: ExpressionSpecification): ExpressionSpecification => {
    const arms: (string | ExpressionSpecification)[] = ['match', dynamicNameExpr];
    for (const category of baseMapPOICategoryValues) {
        const spriteId = `poi-${category}`;
        arms.push(spriteId, ['image', spriteId]);
    }
    arms.push(['image', DEFAULT_BASE_MAP_PLACE_ICON_ID]);
    return arms as ExpressionSpecification;
};
