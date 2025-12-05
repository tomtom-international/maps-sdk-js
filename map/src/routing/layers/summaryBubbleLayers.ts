import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT, MAP_MEDIUM_FONT } from '../../shared/layers/commonLayerProps';
import { suffixNumber } from '../../shared/layers/utils';
import { DESELECTED_SUMMARY_POPUP_IMAGE_ID, SELECTED_SUMMARY_POPUP_IMAGE_ID } from './routeMainLineLayers';
import { magnitudeOfDelayTextColor } from './routeTrafficSectionLayers';
import { DESELECTED_SECONDARY_COLOR, SELECTED_ROUTE_FILTER } from './shared';

/**
 * @ignore
 */
export const TRAFFIC_CLEAR_IMAGE_ID = 'traffic-clear';
/**
 * @ignore
 */
export const TRAFFIC_MAJOR_IMAGE_ID = 'traffic-major';
/**
 * @ignore
 */
export const TRAFFIC_MODERATE_IMAGE_ID = 'traffic-moderate';
/**
 * @ignore
 */
export const TRAFFIC_MINOR_IMAGE_ID = 'traffic-minor';

const hasFormattedTraffic: ExpressionSpecification = ['has', 'formattedTraffic'];

/**
 * Builds the summary bubble symbol layer specification with instance-specific image IDs.
 * @param instanceIndex - Optional instance index for supporting multiple RoutingModule instances
 * @ignore
 */
export const buildSummaryBubbleSymbolPoint = (instanceIndex?: number): LayerSpecTemplate<SymbolLayerSpecification> => {
    const selectedImageID =
        instanceIndex !== undefined
            ? suffixNumber(SELECTED_SUMMARY_POPUP_IMAGE_ID, instanceIndex)
            : SELECTED_SUMMARY_POPUP_IMAGE_ID;
    const deselectedImageID =
        instanceIndex !== undefined
            ? suffixNumber(DESELECTED_SUMMARY_POPUP_IMAGE_ID, instanceIndex)
            : DESELECTED_SUMMARY_POPUP_IMAGE_ID;
    const trafficClearID =
        instanceIndex !== undefined ? suffixNumber(TRAFFIC_CLEAR_IMAGE_ID, instanceIndex) : TRAFFIC_CLEAR_IMAGE_ID;
    const trafficMajorID =
        instanceIndex !== undefined ? suffixNumber(TRAFFIC_MAJOR_IMAGE_ID, instanceIndex) : TRAFFIC_MAJOR_IMAGE_ID;
    const trafficModerateID =
        instanceIndex !== undefined
            ? suffixNumber(TRAFFIC_MODERATE_IMAGE_ID, instanceIndex)
            : TRAFFIC_MODERATE_IMAGE_ID;
    const trafficMinorID =
        instanceIndex !== undefined ? suffixNumber(TRAFFIC_MINOR_IMAGE_ID, instanceIndex) : TRAFFIC_MINOR_IMAGE_ID;

    return {
        type: 'symbol',
        layout: {
            'icon-image': ['case', SELECTED_ROUTE_FILTER, selectedImageID, deselectedImageID],
            'symbol-placement': 'point',
            'icon-rotation-alignment': 'viewport',
            'text-rotation-alignment': 'viewport',
            'symbol-sort-key': ['case', SELECTED_ROUTE_FILTER, 0, 1],
            'icon-text-fit': 'both',
            'icon-text-fit-padding': [10, 5, 5, 10],
            'text-font': [MAP_MEDIUM_FONT],
            'text-size': 13,
            'icon-padding': 0,
            'text-justify': 'left',
            'text-line-height': 1.5,
            'text-field': [
                'format',
                ['get', 'formattedDuration'],
                {
                    'text-font': ['literal', [MAP_BOLD_FONT]],
                    'text-color': ['case', SELECTED_ROUTE_FILTER, 'black', DESELECTED_SECONDARY_COLOR],
                },
                ['concat', '\t\t', ['get', 'formattedDistance']],
                { 'text-color': DESELECTED_SECONDARY_COLOR },
                ['case', hasFormattedTraffic, '\n', ''],
                {},
                [
                    'image',
                    [
                        'case',
                        hasFormattedTraffic,
                        [
                            'match',
                            ['get', 'magnitudeOfDelay'],
                            'major',
                            trafficMajorID,
                            'moderate',
                            trafficModerateID,
                            'minor',
                            trafficMinorID,
                            trafficClearID,
                        ],
                        '',
                    ],
                ],
                {},
                ['case', hasFormattedTraffic, ['concat', '  ', ['get', 'formattedTraffic']], ''],
                {
                    'text-font': ['literal', [MAP_BOLD_FONT]],
                    'text-color': magnitudeOfDelayTextColor,
                },
            ],
        },
        paint: {
            'icon-translate': [0, -35],
            'text-translate': [0, -35],
        },
    };
};

/**
 * Default summary bubble symbol layer (without instance suffix)
 * @ignore
 */
export const summaryBubbleSymbolPoint: LayerSpecTemplate<SymbolLayerSpecification> = buildSummaryBubbleSymbolPoint();
