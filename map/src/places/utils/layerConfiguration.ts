import type { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, LightDark } from '../../shared';
import { TITLE } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlacesModuleConfig } from '../types/placesModuleConfig';
import type { IconScalesMap } from './customIconScales';
import { getAvailabilityColorExpression } from './evAvailabilityHelpers';
import { getTextOffset } from './textOffsetCalculator';
import { getThemeAdaptiveTextColors } from './themeAdaptation';

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
    textField: DataDrivenPropertyValueSpecification<string> | undefined,
    iconTextOffsetScales?: IconScalesMap,
): SymbolLayerSpecification['layout'] => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    const hasCustomIcons = iconTextOffsetScales && iconTextOffsetScales.size > 0;

    // Start with base layout
    const baseLayout = { ...layerSpec.layout };

    // Remove and recalculate offset properties when custom icons, custom offset, or the circle-icon
    // theme is present. `circle-icon` inherits pin-style offsets from pinLayerBaseSpec which must
    // be replaced with centered offsets.
    const needsOffsetRecalculation =
        hasCustomIcons || textConfig?.offset !== undefined || config?.theme === 'circle-icon';

    if (needsOffsetRecalculation) {
        delete baseLayout['text-offset'];
        delete baseLayout['text-variable-anchor-offset'];
        delete baseLayout['text-radial-offset'];
    }

    const layout = {
        ...baseLayout,
        ...customLayer?.layout,
        ...(textConfig?.size && { 'text-size': textConfig.size }),
        ...(textConfig?.font && { 'text-font': textConfig.font }),
        ...(textField !== undefined && { 'text-field': textField }),
    };

    // Apply offset configuration
    if (needsOffsetRecalculation) {
        // Dynamic offset calculation handles custom icons, custom offset, and circle-icon theme centering
        const iconSize = layout['icon-size'];
        const scales = iconTextOffsetScales ?? new Map();
        return { ...layout, ...getTextOffset(iconSize, scales, config?.theme, textConfig?.offset) };
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
    lightDark: LightDark,
): SymbolLayerSpecification['paint'] => {
    const textConfig = config?.text;
    const customLayer = config?.layers?.[layerName];
    const { textColor: baseTextColor, haloColor: baseHaloColor } = getThemeAdaptiveTextColors(lightDark);
    const basePaint = layerSpec.paint ?? {};
    // Theme-adaptive defaults only fill in when the base layer doesn't already
    // define a color — that way layers carrying their own `text-color` (e.g., the
    // base-map style's category/group-driven expression, or `SELECTED_COLOR` on
    // the selected layer) are preserved. User `text.*` config still wins.
    return {
        ...basePaint,
        ...(basePaint['text-color'] === undefined && { 'text-color': baseTextColor }),
        ...(basePaint['text-halo-color'] === undefined && { 'text-halo-color': baseHaloColor }),
        ...(textConfig?.color && { 'text-color': textConfig.color }),
        ...(textConfig?.haloColor && { 'text-halo-color': textConfig.haloColor }),
        ...(textConfig?.haloWidth && { 'text-halo-width': textConfig.haloWidth }),
        ...customLayer?.paint,
    };
};
