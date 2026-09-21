import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, LightDark } from '../../shared';
import type { PlaceConnectionsConfig } from '../types/placesModuleConfig';

// Connection colours, per map theme — line mirrors the places `selected` highlight.
const getThemeAdaptiveConnectionColors = (lightDark: LightDark) => ({
    lineColor: lightDark === 'dark' ? '#5AB6F0' : '#3f9cd9',
    labelColor: lightDark === 'dark' ? '#A9D6F5' : '#1a5f8a',
    labelHaloColor: lightDark === 'dark' ? '#1a1a1a' : '#ffffff',
});

/**
 * @ignore
 */
export type ConnectionLayerSpecs = {
    line: LayerSpecTemplate<LineLayerSpecification>;
    label: LayerSpecTemplate<SymbolLayerSpecification>;
};

// Base dashed line for connections. Width/colour mirror the places `selected`
// highlight colour so the connection reads as visually tied to the place markers.
const buildBaseLineSpec = (lineColor: string): LayerSpecTemplate<LineLayerSpecification> => ({
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-color': lineColor,
        'line-width': 1.5,
        'line-dasharray': [2, 2],
        'line-opacity': 0.9,
    },
});

// Label placed along the line (`line-center` keeps one label per connection, centred).
// A small negative `text-offset` nudges the text perpendicular to the line so it reads
// "a bit on the side" rather than sitting on top of the dashes.
const buildBaseLabelSpec = (
    labelColor: string,
    labelHaloColor: string,
): LayerSpecTemplate<SymbolLayerSpecification> => ({
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
        'text-color': labelColor,
        'text-halo-color': labelHaloColor,
        'text-halo-width': 1.5,
    },
});

/**
 * Builds layer specifications for rendering place-to-place connections.
 *
 * `accentColor` is the map's published accent (styling module); when set it wins for the line and
 * label. Otherwise the colours follow the active light/dark theme.
 * @ignore
 */
export const buildConnectionLayerSpecs = (
    config: PlaceConnectionsConfig | undefined,
    accentColor: string | undefined,
    lightDark: LightDark = 'light',
): ConnectionLayerSpecs => {
    const themed = getThemeAdaptiveConnectionColors(lightDark);
    const customLine = config?.layers?.line;
    const customLabel = config?.layers?.label;
    const baseLineSpec = buildBaseLineSpec(accentColor ?? themed.lineColor);
    const baseLabelSpec = buildBaseLabelSpec(accentColor ?? themed.labelColor, themed.labelHaloColor);

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
