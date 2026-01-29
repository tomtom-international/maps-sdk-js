import type { ExpressionSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { DEFAULT_MAX_PIN_SCALE } from '../../../shared/layers/commonLayerProps';
import { DEFAULT_TEXT_OFFSET_X, DEFAULT_TEXT_OFFSET_Y, ICON_ID } from '../../../shared/layers/symbolLayers';
import { getTextOffset } from '../textOffsetCalculator';

describe('getTextOffset', () => {
    describe('without custom icons', () => {
        test('returns variable-anchor-offset with default offsets', () => {
            const result = getTextOffset(undefined, new Map(), 'pin');

            expect(result).toEqual({
                'text-variable-anchor-offset': [
                    'top',
                    [0, DEFAULT_TEXT_OFFSET_Y],
                    'left',
                    [DEFAULT_TEXT_OFFSET_X, -DEFAULT_TEXT_OFFSET_X],
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X, -DEFAULT_TEXT_OFFSET_X],
                ],
            });
        });

        test('applies custom text offset to anchor positions', () => {
            const result = getTextOffset(undefined, new Map(), 'pin', 3);

            expect(result).toEqual({
                'text-variable-anchor-offset': [
                    'top',
                    [0, 3],
                    'left',
                    [3, -DEFAULT_TEXT_OFFSET_X],
                    'right',
                    [-3, -DEFAULT_TEXT_OFFSET_X],
                ],
            });
        });

        test('scales fallback offsets based on icon size expression', () => {
            const iconSizeExpression: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 8, 0.6, 22, 1.6];
            const scaleMultiplier = 1.6 / DEFAULT_MAX_PIN_SCALE; // 2.0

            const result = getTextOffset(iconSizeExpression, new Map(), 'pin');

            expect(result).toEqual({
                'text-variable-anchor-offset': [
                    'top',
                    [0, DEFAULT_TEXT_OFFSET_Y * scaleMultiplier],
                    'left',
                    [DEFAULT_TEXT_OFFSET_X * scaleMultiplier, -DEFAULT_TEXT_OFFSET_X * scaleMultiplier],
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X * scaleMultiplier, -DEFAULT_TEXT_OFFSET_X * scaleMultiplier],
                ],
            });
        });
    });

    describe('with custom icons and base-map theme', () => {
        const heightScale = 1.5;
        const widthScale = 1.2;
        const customIcons = new Map([['custom-icon', { heightScale: heightScale, widthScale: widthScale }]]);

        test('returns simple text-offset when custom offset is provided', () => {
            const result = getTextOffset(undefined, customIcons, 'base-map', 2.5);

            expect(result).toEqual({
                'text-offset': [2.5, 2.5],
            });
        });

        test('builds case expression with doubled vertical offset and no vertical adjustment', () => {
            const result = getTextOffset(undefined, customIcons, 'base-map');

            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];
            expect(variableAnchorOffset[0]).toBe('case');
            expect(variableAnchorOffset[1]).toEqual(['==', ['get', ICON_ID], 'custom-icon']);
            expect(variableAnchorOffset[2]).toEqual([
                'literal',
                [
                    'top',
                    [0, DEFAULT_TEXT_OFFSET_Y * 2 * heightScale], // Doubled for base-map, scaled by heightScale
                    'left',
                    [DEFAULT_TEXT_OFFSET_X * widthScale, 0], // No vertical adjustment for base-map
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X * widthScale, 0],
                ],
            ]);
        });
    });

    describe('with custom icons and pin theme', () => {
        const heightScale = 1.5;
        const widthScale = 1.2;
        const customIcons = new Map([['custom-icon', { heightScale: heightScale, widthScale: widthScale }]]);

        test('builds case expression with negative vertical adjustment', () => {
            const result = getTextOffset(undefined, customIcons, 'pin');

            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];
            expect(variableAnchorOffset[0]).toBe('case');
            expect(variableAnchorOffset[1]).toEqual(['==', ['get', ICON_ID], 'custom-icon']);
            expect(variableAnchorOffset[2]).toEqual([
                'literal',
                [
                    'top',
                    [0, DEFAULT_TEXT_OFFSET_Y * heightScale],
                    'left',
                    [DEFAULT_TEXT_OFFSET_X * widthScale, -DEFAULT_TEXT_OFFSET_X * widthScale], // Negative vertical adjustment
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X * widthScale, -DEFAULT_TEXT_OFFSET_X * widthScale],
                ],
            ]);
        });

        test('applies custom text offset while preserving vertical adjustment', () => {
            const result = getTextOffset(undefined, customIcons, 'pin', 2);

            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];
            expect(variableAnchorOffset[2]).toEqual([
                'literal',
                [
                    'top',
                    [0, 2],
                    'left',
                    [2, -DEFAULT_TEXT_OFFSET_X * widthScale],
                    'right',
                    [-2, -DEFAULT_TEXT_OFFSET_X * widthScale],
                ],
            ]);
        });
    });
});
