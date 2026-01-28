import { SymbolLayerSpecification } from 'maplibre-gl';
import { LayerSpecTemplate } from '../types';
import { DEFAULT_TEXT_SIZE, MAP_BOLD_FONT, PIN_ICON_SIZE } from './commonLayerProps';

/**
 * @ignore
 */
export const TITLE = 'title';

/**
 * @ignore
 */
export const ICON_ID = 'iconID';

/**
 * Y-offset multiplier for text positioned below icons (top anchor).
 * In ems, relative to icon scale.
 * @ignore
 */
export const DEFAULT_TEXT_OFFSET_Y = 0.7;

/**
 * X-offset multiplier for text positioned beside icons (left/right anchors).
 * In ems, relative to icon scale.
 * @ignore
 */
export const DEFAULT_TEXT_OFFSET_X = 1.4;

/**
 * @ignore
 */
export const DEFAULT_PLACE_ICON_ID = 'default_place';

/**
 * @ignore
 */
export const pinIconBaseLayout: SymbolLayerSpecification['layout'] = {
    'icon-image': ['get', ICON_ID],
    'icon-anchor': 'bottom',
    'icon-size': PIN_ICON_SIZE,
    'icon-allow-overlap': true,
    'icon-padding': 0,
};

/**
 * @ignore
 */
export const pinIconBasePaint: SymbolLayerSpecification['paint'] = {
    'icon-translate': [0, 5],
    'icon-translate-anchor': 'viewport',
};

/**
 * @ignore
 */
export const pinTextBaseLayout: SymbolLayerSpecification['layout'] = {
    'text-optional': true,
    'text-font': [MAP_BOLD_FONT],
    'text-field': ['get', TITLE],
    'text-justify': 'auto',
    'text-variable-anchor': ['top', 'left', 'right'],
    // NOTE: make sure to text against pins and waypoints, in a way that there's enough distance from the pin so the text doesn't disappear
    'text-variable-anchor-offset': [
        'top',
        [0, DEFAULT_TEXT_OFFSET_Y],
        'left',
        [DEFAULT_TEXT_OFFSET_X, -DEFAULT_TEXT_OFFSET_X],
        'right',
        [-DEFAULT_TEXT_OFFSET_X, -DEFAULT_TEXT_OFFSET_X],
    ],
    'text-size': DEFAULT_TEXT_SIZE,
    'text-padding': 5,
};

/**
 * @ignore
 */
export const pinTextBasePaint: SymbolLayerSpecification['paint'] = {
    'text-color': '#333333',
    'text-halo-color': '#FFFFFF',
    'text-halo-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 1.5],
    'text-translate-anchor': 'viewport',
};

/**
 * Pin places, base layer with mostly the icon portion.
 * @ignore
 */
export const pinLayerBaseSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    layout: { ...pinIconBaseLayout, ...pinTextBaseLayout },
    paint: { ...pinIconBasePaint, ...pinTextBasePaint },
};
