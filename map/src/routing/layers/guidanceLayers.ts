import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { RouteWidth } from '../types/routeModuleConfig';
import { getInstructionLineWidth, getInstructionOutlineWidth, SELECTED_ROUTE_FILTER } from './shared';

const commonProps = {
    filter: SELECTED_ROUTE_FILTER,
    minzoom: 16,
};

const commonLineLayout: LayerSpecTemplate<LineLayerSpecification>['layout'] = {
    'line-cap': 'round',
};

/**
 * @ignore
 */
export const instructionOutline = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    ...commonProps,
    type: 'line',
    layout: commonLineLayout,
    paint: {
        'line-width': getInstructionOutlineWidth(routeWidth),
        'line-color': 'grey',
    },
});

/**
 * @ignore
 */
export const instructionLine = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    ...commonProps,
    type: 'line',
    layout: commonLineLayout,
    paint: {
        'line-width': getInstructionLineWidth(routeWidth),
        'line-color': 'white',
    },
});

/**
 * @ignore
 */
export const INSTRUCTION_ARROW_IMAGE_ID = 'instruction-arrow';

/**
 * @ignore
 */
export const instructionArrow: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...commonProps,
    type: 'symbol',
    layout: {
        'icon-allow-overlap': true,
        'icon-image': INSTRUCTION_ARROW_IMAGE_ID, // Will be updated with instance suffix in config
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'lastPointBearingDegrees'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 16, 1, 22, 2],
    },
};
