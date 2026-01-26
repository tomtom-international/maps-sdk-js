import type {
    DataDrivenPropertyValueSpecification,
    ExpressionSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import { DEFAULT_MAX_PIN_SCALE } from '../../shared/layers/commonLayerProps';
import { ICON_ID, TEXT_OFFSET_BESIDE, TEXT_OFFSET_Y_BELOW } from '../../shared/layers/symbolLayers';

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
 * Result of text offset calculation, indicating which MapLibre property to use.
 * @ignore
 */
type TextOffsetResult =
    | { type: 'offset'; value: ExpressionSpecification }
    | { type: 'variable-anchor-offset'; value: VariableAnchorOffset };

/**
 * Calculates text offset configuration for place labels.
 * Returns dynamic text-offset expression when custom icon scales exist, otherwise static variable-anchor-offset.
 *
 * @param iconSizeExpression The icon-size property from the layer specification
 * @param iconTextOffsetScales Map of icon IDs to their text offset scale factors for custom icons
 * @returns Configuration object with the MapLibre property type and value to apply
 * @ignore
 */
export const getTextOffset = (
    iconSizeExpression: DataDrivenPropertyValueSpecification<number> | undefined,
    iconTextOffsetScales?: Map<string, number>,
): TextOffsetResult => {
    const iconScale = extractMaxIconScale(iconSizeExpression);
    const baseScale = iconScale / DEFAULT_MAX_PIN_SCALE;

    // Build dynamic text-offset expression for custom icons
    if (iconTextOffsetScales && iconTextOffsetScales.size > 0) {
        const caseExpr: any[] = ['case'];

        for (const [iconId, customScale] of iconTextOffsetScales.entries()) {
            const yOffset = TEXT_OFFSET_Y_BELOW * customScale;
            caseExpr.push(['==', ['get', ICON_ID], iconId], ['literal', [0, yOffset]]);
        }

        caseExpr.push(['literal', [0, TEXT_OFFSET_Y_BELOW * baseScale]]);

        return {
            type: 'offset',
            value: caseExpr as ExpressionSpecification,
        };
    }

    // No custom scales: use static variable-anchor-offset
    return {
        type: 'variable-anchor-offset',
        value: [
            'top',
            [0, TEXT_OFFSET_Y_BELOW * baseScale],
            'left',
            [TEXT_OFFSET_BESIDE * baseScale, -TEXT_OFFSET_BESIDE * baseScale],
            'right',
            [-TEXT_OFFSET_BESIDE * baseScale, -TEXT_OFFSET_BESIDE * baseScale],
        ],
    };
};
