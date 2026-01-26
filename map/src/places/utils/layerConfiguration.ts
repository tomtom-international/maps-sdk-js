import type { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { TITLE } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlacesModuleConfig } from '../types/placesModuleConfig';
import { getAvailabilityColorExpression } from './evAvailabilityHelpers';
import { getTextOffset } from './textOffsetCalculator';
import { getThemeAdaptiveTextColors } from './themeAdaptation';

/**
 * Map of icon IDs to their text offset scale factors.
 * @ignore
 */
export type IconScalesMap = Map<string, number>;

/**
 * Builds the text field expression for place labels
 * Supports EV availability text when enabled.
 * @ignore
 */
export const buildTextFieldExpression = (
    config: PlacesModuleConfig | undefined,
    evAvailabilityEnabled: boolean,
): DataDrivenPropertyValueSpecification<string> => {
    if (!evAvailabilityEnabled) {
        return ['get', TITLE];
    }

    return [
        'case',
        ['has', 'evAvailabilityText'],
        // If has EV availability, show two-line format with colored availability
        [
            'format',
            ['get', TITLE],
            {},
            '\n',
            {},
            ['get', 'evAvailabilityText'],
            {
                'font-scale': 1.1,
                'text-color': getAvailabilityColorExpression(config?.evAvailability),
            },
        ],
        // Otherwise, show normal title
        ['get', TITLE],
    ];
};

/**
 * Builds the layout configuration
 * @ignore
 */
export const buildLayoutConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    layerName: PlaceLayerName,
    textField: DataDrivenPropertyValueSpecification<string>,
    iconTextOffsetScales?: IconScalesMap,
): SymbolLayerSpecification['layout'] => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    const iconSize = layerSpec.layout?.['icon-size'];
    const calculatedTextOffset = getTextOffset(iconSize, iconTextOffsetScales);

    // Start with base layout, but remove offset properties we'll set explicitly
    const baseLayout = { ...layerSpec.layout };
    delete baseLayout['text-offset'];
    delete baseLayout['text-variable-anchor-offset'];
    delete baseLayout['text-radial-offset'];

    const layout = {
        ...baseLayout,
        ...customLayer?.layout,
        ...(textConfig?.size && { 'text-size': textConfig.size }),
        ...(textConfig?.font && { 'text-font': textConfig.font }),
        'text-field': textField,
    };

    // Apply offset configuration - user config takes precedence
    if (textConfig?.offset) {
        layout['text-offset'] = textConfig.offset;
    } else if (calculatedTextOffset.type === 'offset') {
        layout['text-offset'] = calculatedTextOffset.value;
    } else if (calculatedTextOffset.type === 'variable-anchor-offset') {
        layout['text-variable-anchor-offset'] = calculatedTextOffset.value;
    }

    return layout;
};

/**
 * Builds the paint configuration with theme-adaptive colors.
 * @ignore
 */
export const buildPaintConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    layerName: PlaceLayerName,
    isDarkMode: boolean,
): SymbolLayerSpecification['paint'] => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    const { textColor: baseTextColor, haloColor: baseHaloColor } = getThemeAdaptiveTextColors(isDarkMode);

    return {
        ...layerSpec.paint,
        // Apply theme-adaptive colors as defaults
        ...(!textConfig?.color && { 'text-color': baseTextColor }),
        ...(!textConfig?.haloColor && { 'text-halo-color': baseHaloColor }),
        // User config takes precedence
        ...(textConfig?.color && { 'text-color': textConfig.color }),
        ...(textConfig?.haloColor && { 'text-halo-color': textConfig.haloColor }),
        ...(textConfig?.haloWidth && { 'text-halo-width': textConfig.haloWidth }),
        ...customLayer?.paint,
    };
};
