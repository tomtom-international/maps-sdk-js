import { baseMapLayerGroupSelector } from '../base/layerGroups';
import type { LayerSelector } from '../shared/layers/layerSelector';
import { TRAFFIC_FLOW_SOURCE_ID, TRAFFIC_INCIDENTS_SOURCE_ID } from '../shared/layers/sourcesIDs';
import { type MapColorName, mapColorDefinitions, type PaintColorProperty } from './mapColorCatalogue';
import type { StylingKnobAppliesTo, StylingKnobKind, StylingKnobRange } from './types/stylingTypes';

/** @ignore */
export type ScalableProperty = 'text-size' | 'icon-size' | 'line-width';
/** @ignore */
export type ColorProperty = Extract<PaintColorProperty, 'line-color' | 'text-color' | 'text-halo-color'>;

/**
 * How a knob reaches the style. A knob may use several (e.g. text and icon size together).
 * @ignore
 */
export type KnobMechanism =
    /** M1 — multiplies the property's own value on every matched layer (works on any style). */
    | { type: 'scale'; property: ScalableProperty; layers: LayerSelector[] }
    /** M2 — shows/hides the matched layers. */
    | { type: 'visibility'; layers: LayerSelector[] }
    /**
     * M2 — sets a colour literal on the matched layers; `shades` are layers whose colour the style
     * derived from it (an outline, a tunnel variant) and that are re-derived by the same HSL offset.
     */
    | { type: 'color'; property: ColorProperty; layers: LayerSelector[]; shades?: LayerSelector[] }
    /** Sets the minimum zoom of the matched layers. */
    | { type: 'minZoom'; layers: LayerSelector[] }
    /** Shifts the `["-", ["zoom"], offset]` density term inside the matched layers' filters. */
    | { type: 'zoomOffset'; layers: LayerSelector[] }
    /** Map-level: the projection the whole map is drawn in. */
    | { type: 'projection' }
    /** Map-level: the sky/atmosphere (its colours come from the sibling colour knobs). */
    | { type: 'sky' }
    /** Map-level: 3D terrain from the style's raster-dem source (exaggeration from the sibling knob). */
    | { type: 'terrain' }
    /** Map-level: the colour behind the map canvas, which a globe leaves visible around the planet. */
    | { type: 'space' }
    /**
     * One of the ten semantic map colours: re-derives every literal it governs from the new colour,
     * keeping each one's HSL offset from the style's own base (the anchor).
     */
    | { type: 'mapColor'; color: MapColorName };

/** @ignore */
export type KnobDefinition = {
    kind: StylingKnobKind;
    description: string;
    range?: StylingKnobRange;
    /** The valid values of an `enum` knob. */
    options?: readonly string[];
    appliesTo: StylingKnobAppliesTo;
    mechanisms: KnobMechanism[];
};

// A definition whose kind the catalogue's types keep, so they can tell a colour knob from a toggle.
type KnobDefinitionOf<KIND extends StylingKnobKind> = KnobDefinition & { kind: KIND };

const FACTOR_RANGE: StylingKnobRange = { min: 0.5, max: 1.5, step: 0.1 };
const WIDE_FACTOR_RANGE: StylingKnobRange = { min: 0.5, max: 2, step: 0.1 };

// Every symbol layer drawn from vector tiles: place, road, nature and POI labels, shields, house
// numbers — on any style, TomTom's or not. GeoJSON-backed layers are the SDK's own overlays (places,
// routes) and keep their own sizing.
const baseMapSymbols: LayerSelector = { sourceTypes: ['vector'], layerTypes: ['symbol'] };
// The two POI layers the style ships (`POI`, `POI - Micro`).
const poiLayers: LayerSelector = { sources: ['vectorTiles'], sourceLayers: ['poi'], layerTypes: ['symbol'] };
const roadLines: LayerSelector = { ...baseMapLayerGroupSelector('roads'), layerTypes: ['line'] };

// Flow and incidents draw the same way — one inner line plus one outline layer per class — so both
// take the same selectors, told apart only by the tile source they come from.
const trafficLayers =
    (sourceId: string) =>
    (fragment: string, outline: boolean): LayerSelector => ({
        sources: [sourceId],
        layerTypes: ['line'],
        idIncludes: [outline ? `${fragment} outline` : fragment],
        ...(outline ? {} : { idExcludes: ['outline'] }),
    });

const flowLayers = trafficLayers(TRAFFIC_FLOW_SOURCE_ID);
const incidentLayers = trafficLayers(TRAFFIC_INCIDENTS_SOURCE_ID);

const factor = (
    description: string,
    mechanisms: KnobMechanism[],
    range = FACTOR_RANGE,
): KnobDefinitionOf<'factor'> => ({
    kind: 'factor',
    description,
    range,
    appliesTo: 'any-style',
    mechanisms,
});

const toggle = (description: string, layers: LayerSelector[]): KnobDefinitionOf<'toggle'> => ({
    kind: 'toggle',
    description,
    appliesTo: 'tomtom-styles',
    mechanisms: [{ type: 'visibility', layers }],
});

const color = (
    description: string,
    property: ColorProperty,
    layers: LayerSelector[],
    shades?: LayerSelector[],
): KnobDefinitionOf<'color'> => ({
    kind: 'color',
    description,
    appliesTo: 'tomtom-styles',
    mechanisms: [{ type: 'color', property, layers, shades }],
});

const mapColor = (color: MapColorName): KnobDefinitionOf<'color'> => ({
    kind: 'color',
    description: mapColorDefinitions[color].description,
    appliesTo: 'tomtom-styles',
    mechanisms: [{ type: 'mapColor', color }],
});

// A congestion class: the inner line is the knob, the outline is re-derived as the shade the style
// made of it.
const trafficColor =
    (layers: ReturnType<typeof trafficLayers>) =>
    (description: string, fragment: string): KnobDefinitionOf<'color'> =>
        color(description, 'line-color', [layers(fragment, false)], [layers(fragment, true)]);

const flowColor = trafficColor(flowLayers);
const incidentColor = trafficColor(incidentLayers);

/**
 * The styling knob catalogue: what the SDK can restyle on a TomTom standard style, and how.
 *
 * Ids are public API — additive only. Ranges follow TomTom Map Maker's validated grammar (factors
 * 0.5–1.5 in 0.1 steps) so a value that looks right in the designer's tool looks right here.
 * @ignore
 */
export const knobDefinitions = {
    // Density & sizing — transforms over whatever the style does, so they work on any style.
    'labels.sizeFactor': factor('Size of every base-map text label (places, roads, POIs, house numbers).', [
        { type: 'scale', property: 'text-size', layers: [baseMapSymbols] },
    ]),
    'symbols.sizeFactor': factor('Size of every base-map icon (POI icons, route shields, road arrows).', [
        { type: 'scale', property: 'icon-size', layers: [baseMapSymbols] },
    ]),
    'roads.widthFactor': factor('Width of all road lines, keeping the hierarchy motorway → path.', [
        { type: 'scale', property: 'line-width', layers: [roadLines] },
    ]),
    'pois.sizeFactor': factor('Size of the base-map POI icons and their labels.', [
        { type: 'scale', property: 'icon-size', layers: [poiLayers] },
        { type: 'scale', property: 'text-size', layers: [poiLayers] },
    ]),
    'pois.minZoom': {
        kind: 'number',
        description: 'Zoom level from which base-map POIs appear (the style default is 6).',
        range: { min: 3, max: 18, step: 1 },
        appliesTo: 'tomtom-styles',
        mechanisms: [{ type: 'minZoom', layers: [{ ...poiLayers, idExcludes: ['micro'] }] }],
    },
    'pois.zoomShift': {
        kind: 'number',
        description:
            'Shifts the zoom at which each POI appears: positive = later and sparser, negative = earlier and denser.',
        range: { min: -3, max: 3, step: 1 },
        appliesTo: 'tomtom-styles',
        mechanisms: [{ type: 'zoomOffset', layers: [poiLayers] }],
    },

    // POI appearance.
    'pois.labelColor': color('Text colour of base-map POI labels (replaces the per-category colours).', 'text-color', [
        poiLayers,
    ]),
    'pois.labelOutlineColor': color('Halo colour of base-map POI labels.', 'text-halo-color', [poiLayers]),
    'pois.microMarkers': toggle('The small dot markers for low-priority POIs at high zoom.', [
        { ...poiLayers, idIncludes: ['micro'] },
    ]),

    // Designed feature toggles — the granularity Map Maker's designers chose as toggle-worthy.
    'roads.exitNumbers': toggle('Motorway exit number badges.', [
        { metadataGroups: ['road_label'], layerTypes: ['symbol'], idIncludes: ['exit'] },
    ]),
    'roads.shields': toggle('Route shields along roads.', [
        { metadataGroups: ['road_label'], layerTypes: ['symbol'], idIncludes: ['shield'] },
    ]),
    'roads.arrows': toggle('One-way arrows drawn on roads.', [
        { metadataGroups: ['road'], layerTypes: ['symbol'], idIncludes: ['arrow'] },
    ]),
    'roads.restricted': toggle('Dashed marking of roads with restricted access.', [
        { metadataGroups: ['road'], layerTypes: ['line'], idIncludes: ['restricted'] },
    ]),
    'roads.underConstruction': toggle('Roads under construction.', [
        { metadataGroups: ['road'], layerTypes: ['line'], idIncludes: ['construction'] },
    ]),
    'buildings.footprints': toggle('2D building footprints, shadows and outlines.', [
        { metadataGroups: ['building'], layerTypes: ['fill', 'line'] },
    ]),
    'buildings.3d': toggle('Extruded 3D buildings (hidden by default in the standard styles).', [
        { metadataGroups: ['area_3d', 'building'], layerTypes: ['fill-extrusion'] },
    ]),

    // Traffic appearance — the write direction of the colours the SDK already reads.
    'traffic.flow.freeColor': flowColor('Traffic flow colour for free-flowing roads.', 'free flow'),
    'traffic.flow.slowColor': flowColor('Traffic flow colour for slow traffic.', 'slow flow'),
    'traffic.flow.queueingColor': flowColor('Traffic flow colour for queueing traffic.', 'queueing flow'),
    'traffic.flow.stationaryColor': flowColor('Traffic flow colour for stationary traffic.', 'stationary flow'),
    'traffic.flow.closedColor': color('Traffic flow colour for closed roads.', 'line-color', [
        flowLayers('closed road', true),
    ]),
    'traffic.flow.widthFactor': factor(
        'Width of the traffic flow tubes.',
        [
            {
                type: 'scale',
                property: 'line-width',
                layers: [{ sources: [TRAFFIC_FLOW_SOURCE_ID], layerTypes: ['line'] }],
            },
        ],
        WIDE_FACTOR_RANGE,
    ),
    'traffic.incidents.minorColor': incidentColor('Traffic incident tube colour for minor delays.', 'minor jam'),
    'traffic.incidents.moderateColor': incidentColor(
        'Traffic incident tube colour for moderate delays.',
        'moderate jam',
    ),
    'traffic.incidents.majorColor': incidentColor('Traffic incident tube colour for major delays.', 'major jam'),
    'traffic.incidents.closedColor': color('Traffic incident tube colour for closed roads.', 'line-color', [
        incidentLayers('closed road', true),
    ]),
    'traffic.incidents.widthFactor': factor(
        'Width of the traffic incident tubes.',
        [
            {
                type: 'scale',
                property: 'line-width',
                layers: [{ sources: [TRAFFIC_INCIDENTS_SOURCE_ID], layerTypes: ['line'] }],
            },
        ],
        WIDE_FACTOR_RANGE,
    ),

    // Map colours — Map Maker's ten Foundations colours in its own order, each carrying Map Maker's
    // summary of what it reaches. `setMapColors` is the typed front door to these knobs.
    'colors.land': mapColor('land'),
    'colors.water': mapColor('water'),
    'colors.vegetation': mapColor('vegetation'),
    'colors.park': mapColor('park'),
    'colors.artificial': mapColor('artificial'),
    'colors.roadMajor': mapColor('roadMajor'),
    'colors.road': mapColor('road'),
    'colors.roadOutline': mapColor('roadOutline'),
    'colors.label': mapColor('label'),
    'colors.labelOutline': mapColor('labelOutline'),

    // View — projection, atmosphere and terrain. Map-level MapLibre state the SDK owns here so it
    // survives style switches (MapLibre resets all three on every `setStyle`).
    'view.projection': {
        kind: 'enum',
        description:
            'How the map is drawn: flat Mercator or a globe. The globe flattens to Mercator between zoom 11 and 12 by design.',
        options: ['mercator', 'globe'],
        appliesTo: 'any-style',
        mechanisms: [{ type: 'projection' }],
    },
    'view.sky': {
        kind: 'toggle',
        description:
            'A sky with atmosphere behind the globe and above a tilted flat map. Without it MapLibre draws a fully transparent sky, so a globe arrives with no atmosphere.',
        appliesTo: 'any-style',
        mechanisms: [{ type: 'sky' }],
    },
    'view.skyColor': {
        kind: 'color',
        description:
            'Colour of the sky (and of the atmosphere halo around the globe). Defaults to a daylit blue on a light style and a night blue on a dark one.',
        appliesTo: 'any-style',
        mechanisms: [{ type: 'sky' }],
    },
    'view.horizonColor': {
        kind: 'color',
        description:
            'Colour of the sky at the horizon. Defaults with the style theme, so a dark map gets a dim horizon rather than a white one.',
        appliesTo: 'any-style',
        mechanisms: [{ type: 'sky' }],
    },
    'view.spaceColor': {
        kind: 'color',
        description:
            'Colour behind the map, which a globe leaves visible around the planet. The map canvas is transparent, so without this the page background shows through. Defaults with the style theme: white on a light style, near-black on a dark one.',
        appliesTo: 'any-style',
        mechanisms: [{ type: 'space' }],
    },
    // Terrain works on any style that carries an elevation source — the TomTom hillshade style part,
    // or a custom style's own raster-dem — and reports itself unavailable on one that carries none.
    'view.terrain': {
        kind: 'toggle',
        description:
            "3D terrain from the style's elevation source (the hillshade style part). Needs a tilted camera to show; MapLibre's terrain fog starts at pitch 60, which is also its default maxPitch.",
        appliesTo: 'any-style',
        mechanisms: [{ type: 'terrain' }],
    },
    'view.terrainExaggeration': {
        kind: 'number',
        description: 'Vertical exaggeration of the 3D terrain (1 = true elevation).',
        range: { min: 0.5, max: 3, step: 0.1 },
        appliesTo: 'any-style',
        mechanisms: [{ type: 'terrain' }],
    },
} as const satisfies Record<string, KnobDefinition>;

/**
 * The id of a styling knob — see {@link StylingModule.describe} for what each one does.
 *
 * @group Map Styling
 */
export type StylingKnobId = keyof typeof knobDefinitions;

/**
 * Every styling knob id, in catalogue order.
 *
 * @group Map Styling
 */
export const stylingKnobIds = Object.keys(knobDefinitions) as StylingKnobId[];

/**
 * The id of a styling knob that holds a colour — every colour the styling module can name, and so
 * resolve against whichever style is loaded.
 *
 * @group Map Styling
 */
export type StylingColorKnobId = {
    [ID in StylingKnobId]: (typeof knobDefinitions)[ID]['kind'] extends 'color' ? ID : never;
}[StylingKnobId];

/**
 * Every colour knob id, in catalogue order.
 *
 * @group Map Styling
 */
export const stylingColorKnobIds = stylingKnobIds.filter(
    (id): id is StylingColorKnobId => knobDefinitions[id].kind === 'color',
);

type ValueOfKind<KIND extends StylingKnobKind> = KIND extends 'toggle'
    ? boolean
    : KIND extends 'color' | 'enum'
      ? string
      : number;

/**
 * The value type a given styling knob takes.
 *
 * @group Map Styling
 */
export type StylingKnobValueOf<ID extends StylingKnobId> = ValueOfKind<(typeof knobDefinitions)[ID]['kind']>;
