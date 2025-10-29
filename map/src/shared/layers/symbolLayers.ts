import { SymbolLayerSpecification } from 'maplibre-gl';
import { LayerSpecTemplate } from '../types';
import { DEFAULT_TEXT_SIZE, MAP_BOLD_FONT, PIN_ICON_SIZE } from './commonLayerProps';
import { isClickEventState } from './eventState';

/**
 * @ignore
 */
export const TITLE = 'title';

/**
 * @ignore
 */
export const ICON_ID = 'iconID';

/**
 * @ignore
 */
export const pinIconBaseLayout: SymbolLayerSpecification['layout'] = {
    'icon-image': ['case', isClickEventState, 'default_pin', ['get', ICON_ID]],
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
    'text-variable-anchor-offset': ['top', [0, 0.5], 'left', [1.3, -1.4], 'right', [-1.3, -1.4]],
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
    layout: {
        ...pinIconBaseLayout,
        ...pinTextBaseLayout,
    },
    paint: {
        ...pinIconBasePaint,
        ...pinTextBasePaint,
    },
};
