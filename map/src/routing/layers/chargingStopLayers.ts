import type {
    DataDrivenPropertyValueSpecification,
    FormattedSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { buildCustomIconOffsets, buildIconOffsetExpression } from '../../shared/layers/iconOffset';
import { pinLayerBaseSpec } from '../../shared/layers/symbolLayers';
import { ChargingStopsConfig, ChargingStopTextConfig } from '../types/routeModuleConfig';
import { stopDurationLabelSection } from '../util/stopDuration';
import { SELECTED_ROUTE_FILTER } from './shared';

const chargingStopTextField = (
    config: ChargingStopTextConfig | undefined,
): DataDrivenPropertyValueSpecification<FormattedSpecification> => {
    if (config?.visible === false) {
        return '';
    }

    // The duration shown is the whole time at the stop, styled by the same
    // `stopDurationLabelSection` the waypoint pins use, so both kinds of pin read alike. A label
    // that wants only the charging part can still ask for `chargingDuration`.
    return (
        config?.title ?? [
            'format',
            ['get', 'title'],
            {},
            '\n',
            {},
            ['get', 'chargingPower'],
            {},
            '  •  ',
            {},
            ...stopDurationLabelSection,
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
    // Custom icons are registered under their raw `id` (see RoutingModule), and
    // `toDisplayChargingStops` writes that same raw id into each feature's `iconID`, so the
    // offset expression matches unsuffixed ids — unlike places, which suffixes by instance.
    const iconOffset = buildIconOffsetExpression(buildCustomIconOffsets(config?.icon?.customIcons));

    return {
        ...pinLayerBaseSpec,
        filter: SELECTED_ROUTE_FILTER,
        minzoom: 4,
        layout: {
            ...pinLayerBaseSpec.layout,
            'text-field': chargingStopTextField(config?.text),
            ...(iconOffset && { 'icon-offset': iconOffset }),
        },
        paint: {
            ...pinLayerBaseSpec.paint,
        },
    };
};
