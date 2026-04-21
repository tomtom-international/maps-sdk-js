import type {
    DataDrivenPropertyValueSpecification,
    ExpressionSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import { DEFAULT_MAX_PIN_SCALE } from '../../shared/layers/commonLayerProps';
import { DEFAULT_TEXT_OFFSET_X, DEFAULT_TEXT_OFFSET_Y, ICON_ID } from '../../shared/layers/symbolLayers';
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

    // Literal: 0.8
    if (typeof expression === 'number') {
        return expression;
    }

    // Interpolate expression: ['interpolate', ['linear'], ['zoom'], 8, 0.6, 22, **0.8**]
    if (Array.isArray(expression)) {
        const lastValue = expression.at(-1);
        if (typeof lastValue === 'number') {
            return lastValue;
        }
    }

    // Legacy stops object: { stops: [[10, 0.7], [18, **1**]] }
    if (typeof expression === 'object' && 'stops' in expression) {
        const stops = (expression as { stops: [number, number][] }).stops;
        if (Array.isArray(stops) && stops.length > 0) {
            const lastStop = stops.at(-1);
            if (Array.isArray(lastStop) && typeof lastStop[1] === 'number') {
                return lastStop[1];
            }
        }
    }

    return DEFAULT_MAX_PIN_SCALE;
};

/**
 * Layout properties for text offset - can be spread directly into layer layout.
 */
type TextOffsetLayout = {
    'text-offset'?: [number, number];
    'text-variable-anchor-offset'?: VariableAnchorOffset;
};

/**
 * Rounds to 4 decimal places — prevents float noise (e.g. 0.7*2*1.5 = 2.0999…)
 * from leaking into style JSON when custom icon scales produce non-exact products.
 * @ignore
 */
const round4 = (n: number): number => Math.round(n * 10000) / 10000;

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
        top: hasCustomOffset ? [0, customTextOffset] : [0, round4(topOffset)],
        left: hasCustomOffset
            ? [customTextOffset, round4(pinVerticalAdjustment)]
            : [round4(sideOffset), round4(pinVerticalAdjustment)],
        right: hasCustomOffset
            ? [-customTextOffset, round4(pinVerticalAdjustment)]
            : [-round4(sideOffset), round4(pinVerticalAdjustment)],
    };
};

/**
 * Calculates text offset for place labels
 *
 * @param iconSizeExpression The icon-size property from the layer specification
 * @param iconTextOffsetScales Map of icon IDs to their scale factors (heightScale for vertical, widthScale for horizontal)
 * @param theme The places theme ('base-map'/'circle-icon' for centered icons, 'pin' for bottom-anchored pins)
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
    // 'base-map' and 'circle-icon' both use centered icons; 'pin' is bottom-anchored.
    const isCenteredTheme = theme === 'base-map' || theme === 'circle-icon';
    const hasCustomOffset = customTextOffset !== undefined;

    // For centered themes with a custom offset, use simple text-offset
    if (isCenteredTheme && hasCustomOffset) {
        return {
            'text-offset': [customTextOffset, customTextOffset],
        };
    }

    // Calculate fallback offsets (used when no custom icons or as default case)
    const fallbackTopOffset = DEFAULT_TEXT_OFFSET_Y * iconScaleMultiplier;
    const fallbackSideOffset = DEFAULT_TEXT_OFFSET_X * iconScaleMultiplier;
    const fallbackVerticalAdjustment = isCenteredTheme ? 0 : -fallbackSideOffset;
    const fallbackOffsets = buildAnchorOffsets(
        fallbackTopOffset,
        fallbackSideOffset,
        fallbackVerticalAdjustment,
        customTextOffset,
    );
    const fallbackAnchorOffset = [
        'top',
        fallbackOffsets.top,
        'left',
        fallbackOffsets.left,
        'right',
        fallbackOffsets.right,
    ];

    // No custom icons - return literal value directly (no case expression needed)
    if (iconTextOffsetScales.size === 0) {
        return {
            'text-variable-anchor-offset': fallbackAnchorOffset as VariableAnchorOffset,
        };
    }

    // Build case expression for custom icons
    const offsetCaseExpression: (string | number | ExpressionSpecification)[] = ['case'];

    for (const [iconId, scales] of iconTextOffsetScales.entries()) {
        // Centered themes (base-map / circle-icon) use larger vertical offsets to match native map styling
        const baseTopOffset = isCenteredTheme ? DEFAULT_TEXT_OFFSET_Y * 2 : DEFAULT_TEXT_OFFSET_Y;
        const topOffset = baseTopOffset * scales.heightScale;
        const sideOffset = DEFAULT_TEXT_OFFSET_X * scales.widthScale;

        // Centered themes (centered icon anchor) → no vertical adjustment for side anchors
        // Pin theme uses pins (bottom-anchored) → shift labels upward to align with visual center
        const pinVerticalAdjustment = isCenteredTheme ? 0 : -sideOffset;

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
