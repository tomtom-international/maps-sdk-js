import { describe, expect, test } from 'vitest';
import { scaleNumericValue, shiftZoomOffset } from '../expressionTransforms';

describe('scaleNumericValue', () => {
    test('scales a constant', () => {
        expect(scaleNumericValue(4, 1.5)).toBe(6);
        expect(scaleNumericValue(0.4, 3)).toBe(1.2);
    });

    test('keeps an interpolate ramp and scales every output, including nested match outputs', () => {
        // The compiled shape of `Surface - Motorway & Trunk`'s line-width.
        const lineWidth = [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            5,
            ['match', ['get', 'category'], ['motorway'], 0.4, 0.2],
            19,
            ['match', ['get', 'category'], ['motorway'], 44, 40],
        ];
        expect(scaleNumericValue(lineWidth, 0.5)).toStrictEqual([
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            5,
            ['*', 0.5, ['match', ['get', 'category'], ['motorway'], 0.4, 0.2]],
            19,
            ['*', 0.5, ['match', ['get', 'category'], ['motorway'], 44, 40]],
        ]);
    });

    test('scales step outputs', () => {
        const iconSize = ['step', ['zoom'], 0.7, 14, 0.8, 18, 1];
        expect(scaleNumericValue(iconSize, 2)).toStrictEqual(['step', ['zoom'], 1.4, 14, 1.6, 18, 2]);
    });

    test('wraps a zoom-free expression as a whole', () => {
        // The compiled POI text-size divides by a name-length term; only the whole thing can scale.
        const textSize = ['/', 16.2, ['log10', ['max', ['length', ['get', 'name']], 30]]];
        expect(scaleNumericValue(textSize, 1.3)).toStrictEqual(['*', 1.3, textSize]);
    });

    test('scales the outputs of a legacy stops function', () => {
        expect(
            scaleNumericValue(
                {
                    stops: [
                        [10, 2],
                        [15, 4],
                    ],
                    base: 1.2,
                },
                0.5,
            ),
        ).toStrictEqual({
            stops: [
                [10, 1],
                [15, 2],
            ],
            base: 1.2,
        });
    });

    test('refuses what it cannot scale legally', () => {
        // A zoom term nested where a wrapper would be illegal.
        expect(scaleNumericValue(['match', ['get', 'x'], 1, ['-', ['zoom'], 1], 2], 2)).toBeUndefined();
        expect(scaleNumericValue('12px', 2)).toBeUndefined();
        expect(scaleNumericValue({ stops: [[10, 'a']] }, 2)).toBeUndefined();
    });

    test('rounds away floating-point noise', () => {
        expect(scaleNumericValue(1.1, 1.1)).toBe(1.21);
        expect(scaleNumericValue(2.4000000000000004, 1)).toBe(2.4);
    });
});

describe('shiftZoomOffset', () => {
    // The compiled density filter of the POI layer, abridged.
    const poiFilter = [
        'all',
        ['<=', ['+', ['get', 'display_class'], ['case', ['has', 'brand'], -1, 0]], ['-', ['zoom'], 1]],
    ];

    test('adds the shift to the zoom offset term and reports the patch', () => {
        const { filter, patched } = shiftZoomOffset(poiFilter, 2);
        expect(patched).toBe(true);
        expect(filter).toStrictEqual([
            'all',
            ['<=', ['+', ['get', 'display_class'], ['case', ['has', 'brand'], -1, 0]], ['-', ['zoom'], 3]],
        ]);
        // The input tree is untouched.
        expect(poiFilter[1][2]).toStrictEqual(['-', ['zoom'], 1]);
    });

    test('a shift of zero is the identity and still reports whether there was a term', () => {
        expect(shiftZoomOffset(poiFilter, 0)).toStrictEqual({ filter: poiFilter, patched: true });
        expect(shiftZoomOffset(['==', ['get', 'category'], 'motorway'], 1).patched).toBe(false);
        expect(shiftZoomOffset(undefined, 1)).toStrictEqual({ filter: undefined, patched: false });
    });
});
