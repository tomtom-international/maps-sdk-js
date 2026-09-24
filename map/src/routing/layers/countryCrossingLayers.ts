import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import { suffixNumber } from '../../shared/layers/utils';
import type { CountryCrossingConfig } from '../types/routeModuleConfig';
import { type CountryCrossingColors, resolveCountryCrossingColors } from '../util/countryCrossingColors';
import { SELECTED_ROUTE_FILTER } from './shared';

/**
 * The colours a crossing draws with on a light map, which is what a layer built without a theme
 * falls back to.
 * @ignore
 */
export const DEFAULT_CROSSING_COLORS = resolveCountryCrossingColors(undefined, 'light');

/**
 * The image id of the plaque a crossing label is written on, before any instance suffix.
 * @ignore
 */
export const COUNTRY_CROSSING_PLAQUE_IMAGE_ID = 'route-country-crossing-plaque';

/**
 * The MapLibre layer id of the crossing labels, before any instance prefix.
 * @ignore
 */
export const COUNTRY_CROSSING_LAYER_ID = 'routeCountryCrossing';

/**
 * From which zoom a crossing is drawn. Low enough for a continental route to show its borders while
 * still framed whole.
 */
const CROSSING_DEFAULT_MINZOOM = 4;

// One short string, so the label barely grows with the zoom and stays clear of the place names.
const CROSSING_TEXT_SIZE: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 5, 11, 12, 13];

// The feature's bearing as a map-aligned rotation: 0 is east, and a bearing past south is turned
// back by half a turn so the label reads upright rather than inverted.
const CROSSING_ROUTE_ROTATION: ExpressionSpecification = [
    'case',
    ['>', ['get', 'bearing'], 180],
    ['-', ['get', 'bearing'], 270],
    ['-', ['get', 'bearing'], 90],
];

/**
 * Builds the layer that writes each border crossing on its plaque.
 *
 * @remarks
 * A point layer, because a crossing is the seam between two country sections rather than a stretch
 * of road. `icon-text-fit` stretches the plaque around the label, so one image serves every
 * crossing at every zoom.
 * @ignore
 */
export const countryCrossingSymbol = (
    instanceIndex?: number,
    config?: CountryCrossingConfig,
    colors?: CountryCrossingColors,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    const plaqueImageID =
        instanceIndex !== undefined
            ? suffixNumber(COUNTRY_CROSSING_PLAQUE_IMAGE_ID, instanceIndex)
            : COUNTRY_CROSSING_PLAQUE_IMAGE_ID;
    const alignedToRoute = config?.alignment === 'route';

    return {
        type: 'symbol',
        filter: SELECTED_ROUTE_FILTER,
        minzoom: config?.minzoom ?? CROSSING_DEFAULT_MINZOOM,
        layout: {
            'symbol-placement': 'point',
            'icon-image': plaqueImageID,
            'icon-text-fit': 'both',
            'icon-text-fit-padding': [4, 8, 4, 8],
            'icon-rotation-alignment': alignedToRoute ? 'map' : 'viewport',
            'text-rotation-alignment': alignedToRoute ? 'map' : 'viewport',
            ...(alignedToRoute && {
                'icon-rotate': CROSSING_ROUTE_ROTATION,
                'text-rotate': CROSSING_ROUTE_ROTATION,
            }),
            'text-field': ['get', 'label'],
            'text-font': [MAP_BOLD_FONT],
            'text-size': CROSSING_TEXT_SIZE,
            // There are few enough crossings that keeping every one costs nothing in clutter.
            'text-allow-overlap': true,
            'icon-allow-overlap': true,
            ...(config?.visible === false && { visibility: 'none' }),
        },
        paint: { 'text-color': colors?.text ?? DEFAULT_CROSSING_COLORS.text },
    };
};
