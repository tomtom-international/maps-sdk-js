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
                    [0, 2.1], // DEFAULT_TEXT_OFFSET_Y * 2 * heightScale = 0.7 * 2 * 1.5, rounded
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
                    [0, 1.05], // DEFAULT_TEXT_OFFSET_Y * heightScale = 0.7 * 1.5, rounded
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

    describe('with circle-icon theme (centered icons, no vertical adjustment)', () => {
        test('returns simple text-offset when custom offset is provided', () => {
            const result = getTextOffset(undefined, new Map(), 'circle-icon', 2.5);

            expect(result).toEqual({
                'text-offset': [2.5, 2.5],
            });
        });

        test('returns centered offsets with no vertical adjustment for side anchors', () => {
            const result = getTextOffset(undefined, new Map(), 'circle-icon');

            // iconScaleMultiplier = 1.0 (no iconSizeExpression → DEFAULT_MAX_PIN_SCALE / DEFAULT_MAX_PIN_SCALE)
            expect(result).toEqual({
                'text-variable-anchor-offset': [
                    'top',
                    [0, DEFAULT_TEXT_OFFSET_Y],
                    'left',
                    [DEFAULT_TEXT_OFFSET_X, 0],
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X, 0],
                ],
            });
        });

        test('builds case expression with doubled vertical offset and no vertical adjustment for custom icons', () => {
            const heightScale = 1.5;
            const widthScale = 1.2;
            const customIcons = new Map([['custom-icon', { heightScale, widthScale }]]);

            const result = getTextOffset(undefined, customIcons, 'circle-icon');

            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];
            expect(variableAnchorOffset[0]).toBe('case');
            expect(variableAnchorOffset[1]).toEqual(['==', ['get', ICON_ID], 'custom-icon']);
            expect(variableAnchorOffset[2]).toEqual([
                'literal',
                [
                    'top',
                    [0, 2.1], // DEFAULT_TEXT_OFFSET_Y * 2 * heightScale = 0.7 * 2 * 1.5, rounded
                    'left',
                    [DEFAULT_TEXT_OFFSET_X * widthScale, 0], // No vertical adjustment
                    'right',
                    [-DEFAULT_TEXT_OFFSET_X * widthScale, 0],
                ],
            ]);
        });
    });

    // Regression coverage for the `iconScaleMultiplier` fix: a layer whose `icon-size`
    // maxes out above/below DEFAULT_MAX_PIN_SCALE (e.g. the `selected` pin layer, which
    // renders icons larger than `main`) must scale a custom icon's per-icon offset by the
    // same multiplier it applies to the fallback offset — otherwise an icon with an entry
    // in the map (even an offset-only one with heightScale/widthScale at 1) sits at a
    // different distance from its icon than an icon with no entry at all.
    describe('with a non-default icon-size (e.g. the larger `selected` pin layer)', () => {
        // Mirrors SELECTED_PIN_ICON_SIZE maxing at 1 instead of DEFAULT_MAX_PIN_SCALE (0.8).
        const iconSizeExpression: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 8, 0.8, 22, 1];
        const scaleMultiplier = 1 / DEFAULT_MAX_PIN_SCALE; // 1.25

        test('scales an offset-only icon (heightScale/widthScale at 1) by the same multiplier as the fallback', () => {
            const customIcons = new Map([['offset-only-icon', { heightScale: 1, widthScale: 1 }]]);

            const result = getTextOffset(iconSizeExpression, customIcons, 'pin');
            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];

            const expectedOffsets = [
                'top',
                [0, DEFAULT_TEXT_OFFSET_Y * scaleMultiplier],
                'left',
                [DEFAULT_TEXT_OFFSET_X * scaleMultiplier, -DEFAULT_TEXT_OFFSET_X * scaleMultiplier],
                'right',
                [-DEFAULT_TEXT_OFFSET_X * scaleMultiplier, -DEFAULT_TEXT_OFFSET_X * scaleMultiplier],
            ];

            // Per-icon branch (this icon's case)
            expect(variableAnchorOffset[2]).toEqual(['literal', expectedOffsets]);
            // Fallback branch (for any icon not in the map) — must match exactly
            expect(variableAnchorOffset.at(-1)).toEqual(['literal', expectedOffsets]);
        });

        test('applies the multiplier together with a real heightScale/widthScale difference', () => {
            const heightScale = 1.5;
            const widthScale = 1.2;
            const customIcons = new Map([['custom-icon', { heightScale, widthScale }]]);

            const result = getTextOffset(iconSizeExpression, customIcons, 'pin');
            const variableAnchorOffset = result['text-variable-anchor-offset'] as unknown[];

            // Rounded to 4 decimals to match the implementation's float-noise guard.
            const round4 = (n: number) => Math.round(n * 10000) / 10000;
            const topOffset = round4(DEFAULT_TEXT_OFFSET_Y * heightScale * scaleMultiplier);
            const sideOffset = round4(DEFAULT_TEXT_OFFSET_X * widthScale * scaleMultiplier);

            expect(variableAnchorOffset[2]).toEqual([
                'literal',
                ['top', [0, topOffset], 'left', [sideOffset, -sideOffset], 'right', [-sideOffset, -sideOffset]],
            ]);
        });
    });
});
