import type {
    DataDrivenPropertyValueSpecification,
    ExpressionSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import { DEFAULT_MAX_PIN_SCALE } from '../../shared/layers/commonLayerProps';
import { ICON_ID, DEFAULT_TEXT_OFFSET_X, DEFAULT_TEXT_OFFSET_Y } from '../../shared/layers/symbolLayers';
import type { PlacesTheme } from '../types/placesModuleConfig';

type VariableAnchorOffset = NonNullable<SymbolLayerSpecification['layout']>['text-variable-anchor-offset'];

/**
 * Extracts the maximum icon scale factor from an icon-size expression.
 * For interpolate expressions, returns the last value (max zoom scale).
 * @ignore
 */
const extractMaxIconScale = (expression: DataDrivenPropertyValueSpecification<number> | undefined): number => {
    if (!expression) {
        return DEFAULT_MAX_PIN_SCALE;
    }

    if (typeof expression === 'number') {
        return expression;
    }

    if (Array.isArray(expression)) {
        const lastValue = expression.at(-1);
        if (typeof lastValue === 'number') {
            return lastValue;
        }
    }

    return DEFAULT_MAX_PIN_SCALE;
};

/**
 * Layout properties for text offset - can be spread directly into layer layout.
 * @ignore
 */
type TextOffsetLayout = {
    'text-offset'?: [number, number];
    'text-variable-anchor-offset'?: VariableAnchorOffset;
};

/**
 * Builds anchor offsets for variable-anchor-offset property.
 * @ignore
 */
const buildAnchorOffsets = (
    topOffset: number,
    sideOffset: number,
    pinVerticalAdjustment: number,
    customTextOffset?: number,
): { top: [number, number]; left: [number, number]; right: [number, number] } => {
    const hasCustomOffset = customTextOffset !== undefined;
    // For pin theme with custom offset, override only the primary direction for each anchor
    // top anchor → custom offset applies to vertical, left/right → custom offset applies to horizontal
    return {
        top: hasCustomOffset ? [0, customTextOffset] : [0, topOffset],
        left: hasCustomOffset ? [customTextOffset, pinVerticalAdjustment] : [sideOffset, pinVerticalAdjustment],
        right: hasCustomOffset ? [-customTextOffset, pinVerticalAdjustment] : [-sideOffset, pinVerticalAdjustment],
    };
};

/**
 * Calculates text offset for place labels
 * 
 * @param iconSizeExpression The icon-size property from the layer specification
 * @param iconTextOffsetScales Map of icon IDs to their scale factors (heightScale for vertical, widthScale for horizontal)
 * @param theme The places theme ('base-map' for circles, 'pin' for pins)
 * @param customTextOffset Custom text offset multiplier (overrides default TEXT_OFFSET constants)
 * @returns Configuration object with the MapLibre property type and value to apply
 * @ignore
 */
export const getTextOffset = (
    iconSizeExpression: DataDrivenPropertyValueSpecification<number> | undefined,
    iconTextOffsetScales: Map<string, { heightScale: number; widthScale: number }>,
    theme?: PlacesTheme,
    customTextOffset?: number,
): TextOffsetLayout => {
    const maxIconScale = extractMaxIconScale(iconSizeExpression);
    const iconScaleMultiplier = maxIconScale / DEFAULT_MAX_PIN_SCALE;
    const isBaseMapTheme = theme === 'base-map';
    const hasCustomOffset = customTextOffset !== undefined;

    // For base-map theme with custom offset, use simple text-offset (circles are centered)
    if (isBaseMapTheme && hasCustomOffset) {
        return {
            'text-offset': [customTextOffset, customTextOffset],
        };
    }

    // Calculate fallback offsets (used when no custom icons or as default case)
    const fallbackTopOffset = DEFAULT_TEXT_OFFSET_Y * iconScaleMultiplier;
    const fallbackSideOffset = DEFAULT_TEXT_OFFSET_X * iconScaleMultiplier;
    const fallbackPinVerticalAdjustment = isBaseMapTheme ? 0 : -fallbackSideOffset;
    const fallbackOffsets = buildAnchorOffsets(fallbackTopOffset, fallbackSideOffset, fallbackPinVerticalAdjustment, customTextOffset);
    const fallbackAnchorOffset = ['top', fallbackOffsets.top, 'left', fallbackOffsets.left, 'right', fallbackOffsets.right];

    // No custom icons - return literal value directly (no case expression needed)
    if (iconTextOffsetScales.size === 0) {
        return {
            'text-variable-anchor-offset': fallbackAnchorOffset as VariableAnchorOffset,
        };
    }

    // Build case expression for custom icons
    const offsetCaseExpression: (string | number | ExpressionSpecification)[] = ['case'];

    for (const [iconId, scales] of iconTextOffsetScales.entries()) {
        // Base-map POI layer uses larger vertical offsets than pin theme to match native map styling
        const baseTopOffset = isBaseMapTheme ? DEFAULT_TEXT_OFFSET_Y * 2 : DEFAULT_TEXT_OFFSET_Y;
        const topOffset = baseTopOffset * scales.heightScale;
        const sideOffset = DEFAULT_TEXT_OFFSET_X * scales.widthScale;

        // Base-map theme uses circles (centered) → no vertical adjustment for side anchors
        // Pin theme uses pins (bottom-anchored) → shift labels upward to align with visual center
        const pinVerticalAdjustment = isBaseMapTheme ? 0 : -sideOffset;

        const offsets = buildAnchorOffsets(topOffset, sideOffset, pinVerticalAdjustment, customTextOffset);
        offsetCaseExpression.push(
            ['==', ['get', ICON_ID], iconId],
            ['literal', ['top', offsets.top, 'left', offsets.left, 'right', offsets.right]],
        );
    }

    // Add fallback for icons not in the custom scales map
    offsetCaseExpression.push(['literal', fallbackAnchorOffset]);

    return {
        'text-variable-anchor-offset': offsetCaseExpression as VariableAnchorOffset,
    };
};
