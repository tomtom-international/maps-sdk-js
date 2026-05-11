import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { INCIDENT_DIRECTION_CHEVRON_IMAGE_ID } from '../util/incidentDirectionChevron';
import { FALLBACK_INCIDENT_PALETTE, type IncidentPalette } from '../util/readIncidentPalette';

/**
 * Incident rendering for {@link TrafficIncidentOverlayModule}. All road-class-driven geometry
 * is dropped: REST features carry no `road_category`, `road_subcategory`, `display_class`, or
 * `point_type`, so per-road-class widths and offsets would be uniform approximations
 * pretending to be precise. Incidents render as a uniform stripe centred on the road —
 * callers wanting full per-road-class styling can use the vector-tile
 * `TrafficIncidentsModule` instead.
 *
 * Per-magnitude colours come from a palette passed in (see
 * {@link ../util/readIncidentPalette}). Each factory bakes `beforeID` into every layer spec.
 *
 * @module incidentDetailsLayers
 * @ignore
 */

type LineLayerWithBefore = Omit<LineLayerSpecification, 'source'> & { beforeID?: string };
type SymbolLayerWithBefore = Omit<SymbolLayerSpecification, 'source'> & { beforeID?: string };

// --- Line layers ---------------------------------------------------------------------------

// Zoom interpolations collapsed from canonical's `primary` road-class path. Canonical ramps
// widths up by road class (motorway > trunk > primary > ... > street); we don't have road
// class, so every incident renders at the primary-road width.
const INNER_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['exponential', 1.5],
    ['zoom'],
    5,
    0,
    9,
    0.96,
    13,
    2.1,
    19,
    10.8,
];
const OUTLINE_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['exponential', 1.5],
    ['zoom'],
    5,
    0.75,
    9,
    1.96,
    13,
    3.6,
    19,
    13.8,
];

// Default case uses `major` so an unexpected magnitude is loud, not silent.
const buildColorExpr = (colors: IncidentPalette['outline']): ExpressionSpecification => [
    'match',
    ['get', 'magnitudeOfDelay'],
    'unknown',
    colors.unknown,
    'minor',
    colors.minor,
    'moderate',
    colors.moderate,
    'major',
    colors.major,
    'indefinite',
    colors.indefinite,
    colors.major,
];

// Pattern sprites for magnitudes with no solid colour (no-delay stripe, closed-road stripe).
const INNER_PATTERN: ExpressionSpecification = [
    'match',
    ['get', 'magnitudeOfDelay'],
    'unknown',
    'traffic-incidents-no_delay-pattern',
    'indefinite',
    'traffic-incidents-road_closed-pattern',
    '',
];

// Focus treatment: pop focused features, leave everything else as-is.
//   - `focused=null` (no focus active): every feature renders at full strength.
//   - `focused=true`:  wider stripe + outline painted beneath (when focus styling is enabled).
//   - `focused=false`: identical to `focused=null` — unfocused features are not dimmed.
//
// Defaults are applied via `resolveFocusStyle` and can be overridden / disabled via the
// module's `focus` config.
const DEFAULT_FOCUS_OUTLINE_COLOR = '#000';
const DEFAULT_FOCUS_WIDTH_SCALE = 1.6;

type ResolvedFocus = { outlineColor: string; widthScale: number };

/**
 * Resolve the user's `focus` config into an internal shape:
 *   `false`     → `null` (no halo layer, no width pop, no feature-state expressions on width)
 *   `undefined` → defaults
 *   object      → defaults merged with overrides
 * @ignore
 */
export const resolveFocusStyle = (
    focus: false | { outlineColor?: string; widthScale?: number } | undefined,
): ResolvedFocus | null => {
    if (focus === false) return null;
    return {
        outlineColor: focus?.outlineColor ?? DEFAULT_FOCUS_OUTLINE_COLOR,
        widthScale: focus?.widthScale ?? DEFAULT_FOCUS_WIDTH_SCALE,
    };
};

// Halo spec — a sharp outline painted behind the magnitude outline so it reads as a
// border around the focused stripe. Width tracks the focused outline plus a small constant
// offset; no blur, so the edge is crisp.
const HALO_BLUR = 0;
const HALO_OPACITY = 1;
const HALO_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['exponential', 1.5],
    ['zoom'],
    5,
    2.2,
    9,
    4.6,
    13,
    8.3,
    19,
    26,
];

// Halo opacity: full on focused features, zero elsewhere (MapLibre can't filter on feature-state
// at the filter level for line layers, so we hide via paint instead).
const haloOpacity: ExpressionSpecification = ['case', ['==', ['feature-state', 'focused'], true], HALO_OPACITY, 0];

// MapLibre allows at most ONE zoom-based `interpolate`/`step` in the entire expression tree for
// a given paint property.  A `case` branching between two `interpolate` expressions counts as
// two, which is illegal.  The legal pattern is a single outer `interpolate` whose *stop values*
// (not the zoom axis) contain the feature-state case — per-feature values inside stop outputs
// are evaluated at render time and are not themselves zoom-based sub-expressions.
//
// focusWidth rewrites ['interpolate', curve, ['zoom'], z0, v0, z1, v1, ...]
// into              ['interpolate', curve, ['zoom'], z0, case(v0*s|v0), z1, case(v1*s|v1), ...]
// `scale === null` returns the original expression unmodified — used when the focus
// visual is disabled, so widths don't carry a feature-state expression at all.
const focusWidth = (interp: ExpressionSpecification, scale: number | null): ExpressionSpecification => {
    if (scale === null) return interp;
    const [op, curve, input, ...stops] = interp as unknown as [
        string,
        ExpressionSpecification,
        ExpressionSpecification,
        ...(number | ExpressionSpecification)[],
    ];
    const focusedStops = stops.map((v, i) =>
        i % 2 === 1
            ? ([
                  'case',
                  ['==', ['feature-state', 'focused'], true],
                  (v as number) * scale,
                  v,
              ] as ExpressionSpecification)
            : v,
    );
    return [op, curve, input, ...focusedStops] as unknown as ExpressionSpecification;
};

const SOLID_FILTER: ExpressionSpecification = [
    'in',
    ['get', 'magnitudeOfDelay'],
    ['literal', ['minor', 'moderate', 'major']],
];
const PATTERN_FILTER: ExpressionSpecification = [
    'in',
    ['get', 'magnitudeOfDelay'],
    ['literal', ['unknown', 'indefinite']],
];

/**
 * 4–5 line layers covering all five delay magnitudes plus an optional focus halo:
 *   - focus-halo (only emitted when `focus !== null`; visible only on feature-state.focused=true)
 *   - outline (all magnitudes, colour via match)
 *   - inner solid colour (minor/moderate/major)
 *   - inner direction chevron (minor/moderate/major — white chevron pattern on top of solid,
 *     stretches with line width so it's visible at all zooms where the stripe itself is visible)
 *   - inner pattern (unknown → no-delay stripes, indefinite → road-closed stripes)
 *
 * Replaces canonical's 10 per-magnitude layer pairs; uses match-on-magnitude expressions
 * inside paint rather than duplicating layers. The chevron layer supersedes the canonical
 * per-feature `roads-arrow` symbol (which only activates at z15+ and drops out on short
 * LineStrings because sprite spacing is absolute-pixel). `beforeID` is applied to every layer.
 *
 * `focus === null` (caller passed `focus: false` in the module config) drops the halo layer
 * entirely and leaves widths free of any feature-state expression — `setFocus()` still
 * writes `feature-state.focused`, but no layer reads it.
 * @ignore
 */
export const buildCanonicalIncidentLineLayers = (
    sourceId: string,
    beforeID: string | undefined,
    palette: IncidentPalette = FALLBACK_INCIDENT_PALETTE,
    focus: ResolvedFocus | null = resolveFocusStyle(undefined),
): LineLayerWithBefore[] => {
    const widthScale = focus?.widthScale ?? null;
    const layers: LineLayerWithBefore[] = [];
    if (focus !== null) {
        layers.push({
            // Outline halo. Painted FIRST so it sits beneath the magnitude outline and
            // shows as a border around it; invisible for non-focused features via
            // `line-opacity: 0`.
            id: `${sourceId}-focus-halo`,
            type: 'line',
            minzoom: 6,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': focus.outlineColor,
                'line-width': HALO_WIDTH,
                'line-blur': HALO_BLUR,
                'line-opacity': haloOpacity,
            },
            beforeID,
        });
    }
    layers.push(
        {
            id: `${sourceId}-outline`,
            type: 'line',
            minzoom: 6,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': buildColorExpr(palette.outline),
                'line-width': focusWidth(OUTLINE_WIDTH, widthScale),
            },
            beforeID,
        },
        {
            id: `${sourceId}-inner-solid`,
            type: 'line',
            minzoom: 6,
            filter: SOLID_FILTER,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': buildColorExpr(palette.inner),
                'line-width': focusWidth(INNER_WIDTH, widthScale),
            },
            beforeID,
        },
        {
            // `line-cap: butt` so the rounded end-caps of `-inner-solid` aren't re-stamped by the
            // pattern (which would bleed the chevron into the cap).
            id: `${sourceId}-inner-chevron`,
            type: 'line',
            minzoom: 12,
            filter: SOLID_FILTER,
            layout: { 'line-cap': 'butt', 'line-join': 'round' },
            paint: {
                'line-pattern': INCIDENT_DIRECTION_CHEVRON_IMAGE_ID,
                'line-width': focusWidth(INNER_WIDTH, widthScale),
            },
            beforeID,
        },
        {
            id: `${sourceId}-inner-pattern`,
            type: 'line',
            minzoom: 6,
            filter: PATTERN_FILTER,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-pattern': INNER_PATTERN, 'line-width': focusWidth(INNER_WIDTH, widthScale) },
            beforeID,
        },
    );
    return layers;
};

// --- Symbol layers ------------------------------------------------------------------------

const ICON_SIZE: ExpressionSpecification = ['step', ['zoom'], 0.7, 14, 0.8, 16, 0.9, 18, 1];
const JAM_TEXT_SIZE: ExpressionSpecification = ['step', ['zoom'], 12.6, 14, 14.4, 16, 16.2, 18, 18];

// Non-jam, non-closed-road incidents map category → sprite. `''` suppresses rendering for
// categories with no canonical sprite (jam — handled by jam-marker; animals-on-road,
// narrow-lanes — canonical omits them).
const INCIDENT_MARKER_ICON: ExpressionSpecification = [
    'match',
    ['get', 'category'],
    'other',
    'traffic-incidents-info',
    'accident',
    'traffic-incidents-accident',
    'fog',
    'traffic-incidents-fog',
    'danger',
    'traffic-incidents-roadworks',
    'rain',
    'traffic-incidents-rain',
    'frost',
    'traffic-incidents-frost',
    'lane-closed',
    'traffic-incidents-lane_closed',
    'roadworks',
    'traffic-incidents-roadworks',
    'wind',
    'traffic-incidents-wind',
    'flooding',
    'traffic-incidents-flooding',
    'broken-down-vehicle',
    'traffic-incidents-broken_down_vehicle',
    '',
];

// Canonical declutter: hide short-delay incidents until the user zooms in further. Hides
// indefinite (road closed) — those are drawn by the closed-road-marker layer.
const INCIDENT_MARKER_FILTER: ExpressionSpecification = [
    'all',
    ['!=', ['get', 'magnitudeOfDelay'], 'indefinite'],
    [
        'any',
        ['!', ['has', 'delayInSeconds']],
        [
            'step',
            ['zoom'],
            ['>', ['get', 'delayInSeconds'], 900],
            14,
            ['>', ['get', 'delayInSeconds'], 600],
            15,
            ['>', ['get', 'delayInSeconds'], 300],
            16,
            true,
        ],
    ],
];

const JAM_MARKER_FILTER: ExpressionSpecification = [
    'all',
    ['==', ['get', 'category'], 'jam'],
    ['!=', ['get', 'magnitudeOfDelay'], 'unknown'],
    ['!=', ['get', 'magnitudeOfDelay'], 'indefinite'],
    [
        'step',
        ['zoom'],
        ['>', ['get', 'delayInSeconds'], 900],
        13,
        ['>', ['get', 'delayInSeconds'], 600],
        14,
        ['>', ['get', 'delayInSeconds'], 300],
        15,
        true,
    ],
];

const CLOSED_ROAD_FILTER: ExpressionSpecification = ['==', ['get', 'magnitudeOfDelay'], 'indefinite'];

// Jam sprite: `traffic-jam-<magnitude>-<size>`. Size suffix picks a sprite wide enough to fit
// the delay text rendered alongside (~<10 min, <1 hr, ≥1 hr). Simplified from canonical's
// ~25-line size selector — the visual outcome is the same.
const JAM_ICON: ExpressionSpecification = [
    'concat',
    'traffic-jam-',
    ['get', 'magnitudeOfDelay'],
    [
        'case',
        ['<', ['get', 'delayInSeconds'], 600],
        '-small',
        ['<', ['get', 'delayInSeconds'], 3600],
        '-medium',
        '-large',
    ],
];

// Canonical delay formatting: "1 min" / "X min" / "Y hr Z min" (drops " 0 min" on exact hours).
const JAM_TEXT: ExpressionSpecification = [
    'case',
    ['<=', ['get', 'delayInSeconds'], 60],
    '1 min',
    ['>=', ['get', 'delayInSeconds'], 3600],
    [
        'concat',
        ['to-string', ['floor', ['/', ['to-number', ['get', 'delayInSeconds']], 3600]]],
        ' hr ',
        [
            'case',
            ['==', ['%', ['round', ['/', ['to-number', ['get', 'delayInSeconds']], 60]], 60], 0],
            '',
            [
                'concat',
                ['to-string', ['round', ['%', ['/', ['to-number', ['get', 'delayInSeconds']], 60], 60]]],
                ' min',
            ],
        ],
    ],
    ['concat', ['round', ['/', ['get', 'delayInSeconds'], 60]], ' min'],
];

// Worst-delay incidents sort highest (top). Canonical adds a magnitude tiebreaker (index 0-4);
// dropped because delayInSeconds dominates by orders of magnitude.
const SORT_KEY: ExpressionSpecification = ['case', ['has', 'delayInSeconds'], ['*', -1, ['get', 'delayInSeconds']], 0];

/**
 * 3 symbol layers in z-order: incident marker, jam marker (with delay text), closed-road
 * marker. Canonical splits jam into a pure icon (z12+) and an icon+delay-text layer (z13+);
 * stock MapLibre ignores the `tomtom:transition` hint that would hide one behind the other,
 * so we render a single jam-with-text layer from z12. Direction is rendered by the
 * `-inner-chevron` line layer, not a per-feature symbol.
 * @ignore
 */
export const buildCanonicalIncidentSymbolLayers = (
    sourceId: string,
    beforeID: string | undefined,
): SymbolLayerWithBefore[] => [
    {
        id: `${sourceId}-incident-marker`,
        type: 'symbol',
        minzoom: 13,
        filter: INCIDENT_MARKER_FILTER,
        layout: {
            'symbol-placement': 'point',
            'symbol-avoid-edges': true,
            'icon-anchor': 'bottom-right',
            'icon-offset': [-1, 3],
            'icon-image': INCIDENT_MARKER_ICON,
            'icon-size': ICON_SIZE,
            'symbol-sort-key': SORT_KEY,
        },
        beforeID,
    },
    {
        id: `${sourceId}-jam-marker`,
        type: 'symbol',
        minzoom: 12,
        filter: JAM_MARKER_FILTER,
        layout: {
            'symbol-placement': 'point',
            'icon-anchor': 'bottom-left',
            'icon-offset': [2, 3],
            'icon-image': JAM_ICON,
            'icon-size': ICON_SIZE,
            'icon-padding': 0,
            'text-anchor': 'bottom-left',
            'text-field': JAM_TEXT,
            'text-font': ['NotoSans-CondensedBold'],
            'text-offset': [2.7, -0.75],
            'text-size': JAM_TEXT_SIZE,
            'symbol-sort-key': SORT_KEY,
        },
        paint: { 'text-color': 'hsl(210, 30%, 14%)' },
        beforeID,
    },
    {
        id: `${sourceId}-closed-road-marker`,
        type: 'symbol',
        minzoom: 12,
        filter: CLOSED_ROAD_FILTER,
        layout: {
            'symbol-placement': 'point',
            'symbol-avoid-edges': true,
            'icon-anchor': 'bottom-right',
            'icon-offset': [-1, 3],
            'icon-image': 'traffic-incidents-road_closed',
            'icon-size': ICON_SIZE,
        },
        beforeID,
    },
];
