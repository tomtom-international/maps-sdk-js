import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { PlaceConnectionsConfig } from '../types/placesModuleConfig';

/**
 * @ignore
 */
export type ConnectionLayerSpecs = {
    line: LayerSpecTemplate<LineLayerSpecification>;
    label: LayerSpecTemplate<SymbolLayerSpecification>;
};

// Base dashed line for connections. Width/colour mirror the places `selected`
// highlight colour so the connection reads as visually tied to the place markers.
const baseLineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-color': '#3f9cd9',
        'line-width': 1.5,
        'line-dasharray': [2, 2],
        'line-opacity': 0.9,
    },
};

// Label placed along the line (`line-center` keeps one label per connection, centred).
// A small negative `text-offset` nudges the text perpendicular to the line so it reads
// "a bit on the side" rather than sitting on top of the dashes.
const baseLabelSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    layout: {
        'symbol-placement': 'line-center',
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-offset': [0, -1],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-keep-upright': true,
    },
    paint: {
        'text-color': '#1a5f8a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
    },
};

/**
 * Builds layer specifications for rendering place-to-place connections.
 * @ignore
 */
export const buildConnectionLayerSpecs = (config: PlaceConnectionsConfig | undefined): ConnectionLayerSpecs => {
    const customLine = config?.layers?.line;
    const customLabel = config?.layers?.label;

    return {
        line: {
            ...baseLineSpec,
            ...customLine,
            layout: { ...baseLineSpec.layout, ...customLine?.layout },
            paint: { ...baseLineSpec.paint, ...customLine?.paint },
        },
        label: {
            ...baseLabelSpec,
            ...customLabel,
            layout: { ...baseLabelSpec.layout, ...customLabel?.layout },
            paint: { ...baseLabelSpec.paint, ...customLabel?.paint },
        },
    };
};
