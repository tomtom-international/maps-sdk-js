import type { SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { pinLayerBaseSpec } from '../../shared/layers/symbolLayers';
import { SELECTED_ROUTE_FILTER } from './shared';

// TODO: different icon based on power range (low, middle, high)?

// TODO: optional labels for station name, power, charging time?

// TODO: different placements for the above labels?

/**
 * @ignore
 */
export const routeEVChargingStationSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...pinLayerBaseSpec,
    filter: SELECTED_ROUTE_FILTER,
    minzoom: 4,
    layout: {
        ...pinLayerBaseSpec.layout,
    },
    paint: {
        ...pinLayerBaseSpec.paint,
    },
};
