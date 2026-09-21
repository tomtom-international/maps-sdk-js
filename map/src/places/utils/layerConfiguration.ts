import type { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate, LightDark } from '../../shared';
import { buildIconOffsetExpression } from '../../shared/layers/iconOffset';
import { TITLE } from '../../shared/layers/symbolLayers';
import type { PlaceLayerName, PlacesModuleConfig } from '../types/placesModuleConfig';
import type { IconPositioningMap } from './customIconScales';
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
    iconTextOffsetScales?: IconPositioningMap,
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

    // Text label position: recalculated when custom icons, a custom offset, or the
    // circle-icon theme are present; otherwise the base layout's offsets pass through.
    //
    if (needsOffsetRecalculation) {
        const layoutWithTextOffset = {
            ...layout,
            ...getTextOffset(layout['icon-size'], iconTextOffsetScales ?? new Map(), config?.theme, textConfig?.offset),
        };
        // Icon's own pixel offset — independent of the text-offset recalculation above,
        // applied whenever any custom icon specifies `offsetX`/`offsetY`. Skip `micro`: it
        // never binds `icon-image` to `iconID` (base-map/pin-clustered themes render the
        // style's own group-driven native sprite there, not the custom category icon), so
        // matching on `iconID` would shift that unrelated native sprite instead.
        const iconOffset =
            layerName !== 'micro' &&
            iconTextOffsetScales &&
            buildIconOffsetExpression([...iconTextOffsetScales].map(([iconId, { offset }]) => [iconId, offset]));

        return iconOffset ? { ...layoutWithTextOffset, 'icon-offset': iconOffset } : layoutWithTextOffset;
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
