import type { LayerSelector } from '../shared/layers/layerSelector';
import type { RoadClass } from './colorRewrite';

/**
 * The ten semantic map colours — TomTom Map Maker's *Foundations* palette, under its own names and
 * in its own order. One name drives every layer and shade the style derives from it.
 *
 * | Name | Map Maker | Reaches |
 * |---|---|---|
 * | `land` | Land (base) | Map background and other bare-land features, influences admin borders/labels. Also used to derive all map colours if undefined. |
 * | `water` | Water | Waterbodies, waterways and other water features. Also influences glaciers, water labels and ferry lines. |
 * | `vegetation` | Vegetation | Forests and other land cover such as grass and shrubland. Also influences earth cover vegetation at smaller scales. |
 * | `park` | Park & Recreation | City parks and sport/recreation grounds. Also influences National Parks and other protected areas at smaller scales. |
 * | `artificial` | Artificial | Built-up-areas and man-made features such as landuse grounds and buildings. Also influences railways. |
 * | `roadMajor` | Major Road | Most important road classes, from motorways & trunks to primary roads. Also influences outline and tunnel colours. |
 * | `road` | Road | Less important road classes, from secondary/tertiary to streets and service roads. Also influences tunnel colours. |
 * | `roadOutline` | Road Outline | Road outlines for secondary/tertiary roads and minor classes. Also influences road labels and all other outline colours. |
 * | `label` | Label | Labels for capitals and other populated places/admin areas. Also influences border styling and all other label colours. |
 * | `labelOutline` | Label Outline | Outlines for populated places and admin area labels. Also influences border outlines and all other label halos. |
 *
 * @group Map Styling
 */
export type MapColorName =
    | 'land'
    | 'water'
    | 'vegetation'
    | 'park'
    | 'artificial'
    | 'roadMajor'
    | 'road'
    | 'roadOutline'
    | 'label'
    | 'labelOutline';

/**
 * A partial set of map colours for {@link StylingModule.setMapColors}: any subset of the ten,
 * each a CSS colour string.
 *
 * @example
 * ```typescript
 * styling.setMapColors({ land: '#f3f5f7', water: '#accbe2', roadMajor: '#a1b8ce', label: '#364659' });
 * ```
 *
 * @group Map Styling
 */
export type MapColors = Partial<Record<MapColorName, string>>;

/**
 * Every paint property the styling knobs write a colour to. Listed once as values, since
 * `StylingModule` needs the set at runtime to pick MapLibre's paint setter over its layout one.
 * @ignore
 */
export const paintColorProperties = [
    'fill-color',
    'fill-outline-color',
    'line-color',
    'text-color',
    'text-halo-color',
    'fill-extrusion-color',
    'background-color',
    'hillshade-shadow-color',
    'hillshade-highlight-color',
    'hillshade-accent-color',
] as const;

/** @ignore */
export type PaintColorProperty = (typeof paintColorProperties)[number];

/**
 * One set of (layers, properties) a semantic colour governs, optionally only on one side of the
 * major/minor road split inside a `match` on the road class.
 * @ignore
 */
export type MapColorTarget = {
    layers: LayerSelector[];
    properties: PaintColorProperty[];
    roadClass?: RoadClass;
};

/**
 * @ignore
 */
export type MapColorDefinition = {
    /**
     * What the colour reaches, in one line: Map Maker's own summary, which the `colors.*` knob
     * publishes through {@link StylingModule.describe}.
     */
    description: string;
    /** Where the colour's base literal is read from: the first matching layer that has the property. */
    anchor: { layers: LayerSelector[]; property: PaintColorProperty; roadClass?: RoadClass };
    targets: MapColorTarget[];
};

// The colour properties each layer type paints through — a fill's rim included, or a recoloured
// water body keeps the shore line the style gave it.
const paintedBy = {
    fill: ['fill-color', 'fill-outline-color'],
    line: ['line-color'],
    'fill-extrusion': ['fill-extrusion-color'],
} as const satisfies Record<string, readonly PaintColorProperty[]>;

const paintLayers =
    <TYPE extends keyof typeof paintedBy>(layerType: TYPE) =>
    (selector: LayerSelector): MapColorTarget => ({
        layers: [{ ...selector, layerTypes: [layerType] }],
        properties: [...paintedBy[layerType]],
    });

const fillLayers = paintLayers('fill');
const lineLayers = paintLayers('line');
const extrusionLayers = paintLayers('fill-extrusion');

// Road lines by id fragment within the `road` metadata group; ids are TomTom's to capitalise.
const roadLine = (idIncludes: string[], idExcludes?: string[]): LayerSelector => ({
    metadataGroups: ['road'],
    layerTypes: ['line'],
    idIncludes,
    ...(idExcludes && { idExcludes }),
});

// The road layers that draw several classes in one `match` on the road class (tunnels, bridges).
const MIXED_CLASS_ROAD_LINES = roadLine(['road line', 'road outline', 'under construction'], ['tarmac']);
const MAJOR_ROAD_LINES = roadLine(['motorway', 'primary road', 'major road']);
const MINOR_ROAD_LINES = roadLine(
    ['secondary road', 'tertiary road', 'street', 'minor road', 'link road', 'restricted', 'service road'],
    ['outline'],
);
const MINOR_ROAD_OUTLINES = roadLine([
    'secondary road outline',
    'tertiary road outline',
    'street outline',
    'minor road outline',
    'link road outline',
    'tarmac outline',
]);
const RAIL_AND_PATH_LINES = roadLine(['railway', 'subway', 'track', 'path', 'aerialway'], ['outline']);

// Label layers whose text the `label` colour governs: everything with text except shields and exit
// numbers (their colours come from the shield artwork) and water labels (governed by `water`).
const TEXT_LAYERS: LayerSelector = {
    metadataGroups: ['places_label', 'road_label', 'label', 'address_point_label', 'border_label'],
    layerTypes: ['symbol'],
    idExcludes: ['shield', 'exit', 'water', 'river'],
};
const WATER_TEXT_LAYERS: LayerSelector = {
    metadataGroups: ['label'],
    layerTypes: ['symbol'],
    idIncludes: ['water', 'river'],
};

/**
 * What each of the ten colours reaches in the standard styles, and where its base is read from,
 * following Map Maker's own derivation tree so the recolour fans out the way the designers meant.
 * @ignore
 */
export const mapColorDefinitions: Record<MapColorName, MapColorDefinition> = {
    land: {
        description:
            'Map background and other bare-land features, influences admin borders/labels. Also used to derive all map colours if undefined.',
        anchor: { layers: [{ layerTypes: ['background'] }], property: 'background-color' },
        targets: [
            { layers: [{ layerTypes: ['background'] }], properties: ['background-color'] },
            // The ground the background never shows through: bare earth and sand inside the
            // landcover expressions, pedestrian areas, bridges and piers. `vegetation` owns the
            // greens and `artificial` the built-up shades those same layers also carry — a bridge
            // reads as land at low zoom and as built-up at high — so the hue test, not the layer
            // list, is what splits each expression between them.
            fillLayers({ metadataGroups: ['area'], idIncludes: ['earth cover', 'landcover'] }),
            fillLayers({ metadataGroups: ['road_area'] }),
            fillLayers({ metadataGroups: ['transit_area'] }),
            lineLayers({ metadataGroups: ['transit_area'] }),
        ],
    },
    water: {
        description:
            'Waterbodies, waterways and other water features. Also influences glaciers, water labels and ferry lines.',
        anchor: {
            layers: [{ metadataGroups: ['water'], layerTypes: ['fill'], idIncludes: ['fill'] }],
            property: 'fill-color',
        },
        targets: [
            fillLayers({ metadataGroups: ['water'] }),
            lineLayers({ metadataGroups: ['water'] }),
            { layers: [WATER_TEXT_LAYERS], properties: ['text-color', 'text-halo-color'] },
            lineLayers({ metadataGroups: ['road'], idIncludes: ['ferry'] }),
        ],
    },
    vegetation: {
        description:
            'Forests and other land cover such as grass and shrubland. Also influences earth cover vegetation at smaller scales.',
        anchor: {
            layers: [{ metadataGroups: ['area'], layerTypes: ['fill'], idIncludes: ['landcover'] }],
            property: 'fill-color',
        },
        targets: [fillLayers({ metadataGroups: ['area'], idIncludes: ['landcover', 'earth cover'] })],
    },
    park: {
        description:
            'City parks and sport/recreation grounds. Also influences National Parks and other protected areas at smaller scales.',
        anchor: {
            layers: [{ metadataGroups: ['area'], layerTypes: ['fill'], idIncludes: ['protected'] }],
            property: 'fill-color',
        },
        targets: [
            // `landuse` draws every land-use group in one expression, parks among them; the hue test
            // takes its greens and leaves a hospital's pink or a shopping area's yellow alone.
            fillLayers({ metadataGroups: ['area'], idIncludes: ['protected', 'outdoor', 'sport', 'landuse'] }),
            lineLayers({ metadataGroups: ['border'], idIncludes: ['overlays'] }),
        ],
    },
    artificial: {
        description:
            'Built-up-areas and man-made features such as landuse grounds and buildings. Also influences railways.',
        anchor: {
            layers: [{ metadataGroups: ['area'], layerTypes: ['fill'], idIncludes: ['built-up'] }],
            property: 'fill-color',
        },
        targets: [
            fillLayers({ metadataGroups: ['area'], idIncludes: ['built-up', 'landuse', 'parking'] }),
            fillLayers({ metadataGroups: ['building', 'transit_area', 'road_area'] }),
            lineLayers({ metadataGroups: ['building', 'transit_area'] }),
            extrusionLayers({ metadataGroups: ['area_3d', 'building'] }),
            lineLayers(RAIL_AND_PATH_LINES),
        ],
    },
    roadMajor: {
        description:
            'Most important road classes, from motorways & trunks to primary roads. Also influences outline and tunnel colours.',
        anchor: { layers: [roadLine(['motorway & trunk'], ['outline'])], property: 'line-color', roadClass: 'major' },
        targets: [
            lineLayers(MAJOR_ROAD_LINES),
            { layers: [MIXED_CLASS_ROAD_LINES], properties: ['line-color'], roadClass: 'major' },
        ],
    },
    road: {
        description:
            'Less important road classes, from secondary/tertiary to streets and service roads. Also influences tunnel colours.',
        anchor: { layers: [roadLine(['secondary road'], ['outline'])], property: 'line-color' },
        targets: [
            lineLayers(MINOR_ROAD_LINES),
            { layers: [roadLine(['road line', 'under construction'])], properties: ['line-color'], roadClass: 'minor' },
        ],
    },
    roadOutline: {
        description:
            'Road outlines for secondary/tertiary roads and minor classes. Also influences road labels and all other outline colours.',
        anchor: { layers: [roadLine(['secondary road outline'])], property: 'line-color' },
        targets: [
            lineLayers(MINOR_ROAD_OUTLINES),
            { layers: [roadLine(['road outline'], ['tarmac'])], properties: ['line-color'], roadClass: 'minor' },
        ],
    },
    label: {
        description:
            'Labels for capitals and other populated places/admin areas. Also influences border styling and all other label colours.',
        anchor: {
            layers: [{ metadataGroups: ['places_label'], layerTypes: ['symbol'], idIncludes: ['city'] }],
            property: 'text-color',
        },
        targets: [
            { layers: [TEXT_LAYERS], properties: ['text-color'] },
            lineLayers({ metadataGroups: ['border'], idIncludes: ['country', 'state', 'treaty', 'disputed'] }),
        ],
    },
    labelOutline: {
        description:
            'Outlines for populated places and admin area labels. Also influences border outlines and all other label halos.',
        anchor: {
            layers: [{ metadataGroups: ['places_label'], layerTypes: ['symbol'], idIncludes: ['city'] }],
            property: 'text-halo-color',
        },
        targets: [
            { layers: [TEXT_LAYERS], properties: ['text-halo-color'] },
            lineLayers({ metadataGroups: ['border'], idIncludes: ['background'] }),
        ],
    },
};

/**
 * The ten map colour names, in Map Maker's Foundations order.
 *
 * @group Map Styling
 */
export const mapColorNames = Object.keys(mapColorDefinitions) as MapColorName[];

/**
 * Whether a caller-supplied key names one of the map colours.
 * @ignore
 */
export const isMapColorName = (name: string): name is MapColorName => name in mapColorDefinitions;
