import type { StylingPresetDescriptor } from './types/stylingTypes';

// A preset as authored: everything {@link StylingModule.describe} reports about it but its id, which
// is the key it sits under.
type PresetDefinition = Omit<StylingPresetDescriptor, 'id'>;

/**
 * The styling presets the SDK ships: named bundles of knob settings for common intents. Each is data
 * over the knob catalogue, so a preset is exactly as durable as the knobs it sets, and an app can
 * start from one and adjust.
 * @ignore
 */
export const stylingPresets = {
    'data-viz': {
        name: 'Data visualisation',
        description:
            'A quiet base for your own data on top: fewer labels and markers, thinner roads, no badges competing with the overlay.',
        settings: {
            'labels.sizeFactor': 0.9,
            'symbols.sizeFactor': 0.9,
            'roads.widthFactor': 0.8,
            'roads.exitNumbers': false,
            'roads.shields': false,
            'roads.arrows': false,
            'pois.microMarkers': false,
            'pois.minZoom': 14,
            'buildings.3d': false,
        },
    },
    'night-driving': {
        name: 'Night driving',
        description: 'Bigger labels and shields, wider roads and traffic tubes, POIs out of the way until close up.',
        settings: {
            'labels.sizeFactor': 1.2,
            'symbols.sizeFactor': 1.2,
            'roads.widthFactor': 1.2,
            'roads.exitNumbers': true,
            'roads.shields': true,
            'roads.arrows': true,
            'pois.minZoom': 13,
            'pois.microMarkers': false,
            'traffic.flow.widthFactor': 1.3,
            'buildings.3d': false,
        },
    },
    minimal: {
        name: 'Minimal',
        description: 'The bare map: land, water, roads and the main place names. Everything decorative off.',
        settings: {
            'labels.sizeFactor': 0.9,
            'roads.exitNumbers': false,
            'roads.shields': false,
            'roads.arrows': false,
            'roads.restricted': false,
            'roads.underConstruction': false,
            'buildings.footprints': false,
            'buildings.3d': false,
            'pois.microMarkers': false,
            'pois.minZoom': 16,
        },
    },
    globe: {
        name: 'Globe',
        description: 'A globe with an atmosphere for the zoomed-out view; flattens to Mercator as you zoom in.',
        settings: {
            'view.projection': 'globe',
            'view.sky': true,
        },
    },
    terrain: {
        name: 'Terrain',
        description: '3D terrain with a sky for tilted views. Needs the hillshade style part and a pitched camera.',
        settings: {
            'view.terrain': true,
            'view.terrainExaggeration': 1.2,
            'view.sky': true,
        },
    },
} as const satisfies Record<string, PresetDefinition>;

/**
 * The id of a styling preset, as accepted by {@link StylingModule.applyPreset}.
 *
 * @group Map Styling
 */
export type StylingPresetId = keyof typeof stylingPresets;

/**
 * Every styling preset id, in catalogue order.
 *
 * @group Map Styling
 */
export const stylingPresetIds = Object.keys(stylingPresets) as StylingPresetId[];
