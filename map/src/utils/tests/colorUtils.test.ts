import { describe, expect, test } from 'vitest';
import { parseCssColor } from '../colorUtils';

// Red, green and blue as 0–255 integers, which is how the expectations below read most naturally.
const channelsOf = (cssColor: string): number[] | undefined =>
    parseCssColor(cssColor)
        ?.slice(0, 3)
        .map((channel) => Math.round(channel * 255));

describe('parseCssColor', () => {
    test('reads hex and rgb() literals, with their alpha', () => {
        expect(channelsOf('#ff0000')).toEqual([255, 0, 0]);
        expect(channelsOf('#0f0')).toEqual([0, 255, 0]);
        expect(channelsOf('rgba(12, 34, 56, 0.5)')).toEqual([12, 34, 56]);
        expect(parseCssColor('rgba(12, 34, 56, 0.5)')?.[3]).toBe(0.5);
    });

    // The notation the TomTom traffic palettes are written in.
    test('reads hsl() and hsla()', () => {
        expect(channelsOf('hsla(145, 60%, 30%, 1)')).toEqual([31, 122, 69]);
        expect(channelsOf('hsl(40, 100%, 43%)')).toEqual([219, 146, 0]);
        expect(channelsOf('hsla(0, 100%, 28%, 1)')).toEqual([143, 0, 0]);
    });

    test('reads named colours, percentage channels and transparent', () => {
        expect(channelsOf('darkred')).toEqual([139, 0, 0]);
        expect(channelsOf('rgb(100%, 0%, 0%)')).toEqual([255, 0, 0]);
        expect(parseCssColor('transparent')?.[3]).toBe(0);
    });

    test('reads the space-separated syntax, with a slash before the alpha', () => {
        expect(parseCssColor('rgb(12 34 56 / 50%)')).toEqual([12 / 255, 34 / 255, 56 / 255, 0.5]);
        expect(channelsOf('hsl(0 100% 28% / 1)')).toEqual([143, 0, 0]);
    });

    test('returns undefined for a value that is not a colour', () => {
        expect(parseCssColor('interpolate')).toBeUndefined();
        expect(parseCssColor('#12')).toBeUndefined();
        expect(parseCssColor('rgb(12, 34)')).toBeUndefined();
    });

    // Rejecting these, rather than guessing, is what makes a caller's validation throw on a typo.
    test('returns undefined for rgb() and hsl() that mix separators or channel units', () => {
        expect(parseCssColor('rgb(12, 34 56)')).toBeUndefined();
        expect(parseCssColor('rgb(100%, 0, 0)')).toBeUndefined();
        expect(parseCssColor('hsl(0, 100% 50%)')).toBeUndefined();
    });
});
