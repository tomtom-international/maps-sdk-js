import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import {
    DESELECTED_FOREGROUND_COLOR,
    DESELECTED_OUTLINE_COLOR,
    DESELECTED_ROUTE_FILTER,
    ROUTE_LINE_FOREGROUND_COLOR,
    ROUTE_LINE_FOREGROUND_WIDTH,
    ROUTE_LINE_OUTLINE_COLOR,
    SELECTED_ROUTE_FILTER,
} from './shared';

/**
 * @ignore
 */
export const routeLineBaseTemplate: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
        'line-sort-key': ['get', 'index'],
    },
};

const outlineLineWidth: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 1, 5, 5, 6, 10, 10, 18, 14];

/**
 * @ignore
 */
export const routeDeselectedOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        'line-color': DESELECTED_OUTLINE_COLOR,
        'line-width': outlineLineWidth,
    },
};

/**
 * @ignore
 */
export const routeDeselectedLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        'line-color': DESELECTED_FOREGROUND_COLOR,
        'line-width': ROUTE_LINE_FOREGROUND_WIDTH,
    },
};

/**
 * @ignore
 */
export const routeOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        'line-color': ROUTE_LINE_OUTLINE_COLOR,
        'line-width': outlineLineWidth,
    },
};

/**
 * @ignore
 */
export const routeMainLine = (props?: { color?: string }): LayerSpecTemplate<LineLayerSpecification> => ({
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        'line-color': props?.color ?? ROUTE_LINE_FOREGROUND_COLOR,
        'line-width': ROUTE_LINE_FOREGROUND_WIDTH,
    },
});

/**
 * @ignore
 */
export const routeLineArrows: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    layout: {
        'symbol-placement': 'line',
        'icon-image': 'roads-arrow-white',
        // The current arrow icon seems to point backwards otherwise. Check with caution!
        'icon-rotate': 180,
    },
};

/**
 * @ignore
 */
export const SELECTED_SUMMARY_POPUP_IMAGE_ID = 'selected-route-summary-popup';
/**
 * @ignore
 */
export const DESELECTED_SUMMARY_POPUP_IMAGE_ID = 'deselected-route-summary-popup';
