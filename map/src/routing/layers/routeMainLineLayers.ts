import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { RouteWidth } from '../types/routeModuleConfig';
import {
    DESELECTED_FOREGROUND_COLOR,
    DESELECTED_OUTLINE_COLOR,
    DESELECTED_ROUTE_FILTER,
    getLineForegroundWidth,
    getLineOutlineWidth,
    ROUTE_LINE_FOREGROUND_COLOR,
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

/**
 * @ignore
 */
export const routeDeselectedOutline = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        'line-color': DESELECTED_OUTLINE_COLOR,
        'line-width': getLineOutlineWidth(routeWidth),
    },
});

/**
 * @ignore
 */
export const routeDeselectedLine = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        'line-color': DESELECTED_FOREGROUND_COLOR,
        'line-width': getLineForegroundWidth(routeWidth),
    },
});

/**
 * @ignore
 */
export const routeOutline = (
    routeWidth?: RouteWidth,
    outlineColor?: string,
): LayerSpecTemplate<LineLayerSpecification> => ({
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        'line-color': outlineColor ?? ROUTE_LINE_OUTLINE_COLOR,
        'line-width': getLineOutlineWidth(routeWidth),
    },
});

/**
 * @ignore
 */
export const routeMainLine = (
    routeWidth?: RouteWidth,
    routeColor?: string,
): LayerSpecTemplate<LineLayerSpecification> => ({
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        'line-color': routeColor ?? ROUTE_LINE_FOREGROUND_COLOR,
        'line-width': getLineForegroundWidth(routeWidth),
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
