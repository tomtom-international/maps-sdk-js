import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import {
    MAJOR_DELAY_COLOR,
    MINOR_DELAY_LABEL_COLOR,
    MODERATE_DELAY_COLOR,
    SELECTED_ROUTE_FILTER,
    UNKNOWN_DELAY_COLOR,
} from './shared';

const EXTRA_FOREGROUND_LINE_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    1,
    2,
    5,
    3,
    10,
    4,
    18,
    6,
];

/**
 * @ignore
 */
export const routeIncidentsBGLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    layout: { 'line-cap': 'round' },
    paint: {
        'line-width': EXTRA_FOREGROUND_LINE_WIDTH,
        'line-color': [
            'match',
            ['get', 'magnitudeOfDelay'],
            'minor',
            '#FFC105',
            'moderate',
            MODERATE_DELAY_COLOR,
            'major',
            MAJOR_DELAY_COLOR,
            // other
            '#C7D2D8',
        ],
    },
};

/**
 * @ignore
 */
export const routeIncidentsDashedLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    filter: ['in', ['get', 'magnitudeOfDelay'], ['literal', ['unknown', 'indefinite']]],
    layout: { 'line-join': 'round' },
    paint: {
        'line-width': EXTRA_FOREGROUND_LINE_WIDTH,
        'line-color': [
            'match',
            ['get', 'magnitudeOfDelay'],
            'unknown',
            'rgba(190, 39, 27, 1)',
            // other (undefined):
            'rgba(137, 150, 168, 1)',
        ],
        'line-dasharray': [1.5, 1],
    },
};

/**
 * @ignore
 */
export const magnitudeOfDelayTextColor: ExpressionSpecification = [
    'match',
    ['get', 'magnitudeOfDelay'],
    'minor',
    MINOR_DELAY_LABEL_COLOR,
    'moderate',
    MODERATE_DELAY_COLOR,
    'major',
    MAJOR_DELAY_COLOR,
    'indefinite',
    '#666666',
    // other
    UNKNOWN_DELAY_COLOR,
];

const routeIncidentsSymbolBase: LayerSpecTemplate<SymbolLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: 'symbol',
    minzoom: 6,
    layout: {
        'symbol-placement': 'point',
        'symbol-avoid-edges': true,
        'icon-ignore-placement': true,
    },
};

/**
 * @ignore
 */
export const routeIncidentsJamSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...routeIncidentsSymbolBase,
    filter: ['all', ['has', 'jamIconID'], routeIncidentsSymbolBase.filter as ExpressionSpecification],
    layout: {
        ...routeIncidentsSymbolBase.layout,
        'icon-image': ['get', 'jamIconID'],
        'icon-anchor': 'bottom-left',
        'text-anchor': 'bottom-left',
        // Jam symbols have delay labels in them:
        'text-field': ['get', 'title'],
        'text-font': [MAP_BOLD_FONT],
        'text-offset': [3.9, -1.4],
        'text-size': 13,
    },
    paint: {
        ...routeIncidentsSymbolBase.paint,
        'text-color': magnitudeOfDelayTextColor,
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1,
    },
};

/**
 * @ignore
 */
export const routeIncidentsCauseSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...routeIncidentsSymbolBase,
    filter: ['all', ['has', 'causeIconID'], routeIncidentsSymbolBase.filter as ExpressionSpecification],
    layout: {
        ...routeIncidentsSymbolBase.layout,
        'icon-image': ['get', 'causeIconID'],
        'icon-anchor': 'bottom-right',
        // Cause symbols have no label in them.
    },
    paint: { ...routeIncidentsSymbolBase.paint },
};
