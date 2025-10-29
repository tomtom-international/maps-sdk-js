import type {
    DataDrivenPropertyValueSpecification,
    FormattedSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { pinLayerBaseSpec } from '../../shared/layers/symbolLayers';
import { ChargingStopsConfig, ChargingStopTextConfig } from '../types/routeModuleConfig';
import { SELECTED_ROUTE_FILTER } from './shared';

const chargingStopTextField = (
    config: ChargingStopTextConfig | undefined,
): DataDrivenPropertyValueSpecification<FormattedSpecification> => {
    if (config?.visible === false) {
        return '';
    }

    return (
        config?.title ?? [
            'format',
            ['get', 'title'],
            '\n',
            ['get', 'chargingPower'],
            '  •  ',
            ['get', 'chargingDuration'],
        ]
    );
};

/**
 * @ignore
 * @see toDisplayChargingStops
 */
export const chargingStopSymbol = (
    config: ChargingStopsConfig | undefined,
): LayerSpecTemplate<SymbolLayerSpecification> => {
    return {
        ...pinLayerBaseSpec,
        filter: SELECTED_ROUTE_FILTER,
        minzoom: 4,
        layout: {
            ...pinLayerBaseSpec.layout,
            'text-field': chargingStopTextField(config?.text),
        },
        paint: {
            ...pinLayerBaseSpec.paint,
        },
    };
};
