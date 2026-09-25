import { type RGBAColor, stylingColorKnobIds } from '@tomtom-org/maps-sdk/map';
import { describe, expect, test } from 'vitest';
import {
    bloomScopeNames,
    buildScopeMask,
    invalidScopeEntry,
    maskPixels,
    scopeColors,
    scopeReadsStyling,
} from '../bloomScope';
import { effectKnobDefinitions } from '../effectsCatalogue';
import { stylingWith } from './fakeStyling';

type Pixel = [red: number, green: number, blue: number];

// A key colour as the styling module's colour parser hands it over: each channel 0–1.
const keyOf = ([red, green, blue]: Pixel): RGBAColor => [red / 255, green / 255, blue / 255, 1];

// Whether bloom may light a pixel of this colour: the mask blacks out everything it does not cover.
const lit = (mask: Uint8Array, [red, green, blue]: Pixel): boolean => {
    const pixels = new Uint8ClampedArray([red, green, blue, 255]);
    maskPixels(pixels, mask);
    return pixels[0] !== 0 || pixels[1] !== 0 || pixels[2] !== 0;
};

const maskOf = (colors: Pixel[], tolerance: number): Uint8Array => {
    const mask = buildScopeMask(colors.map(keyOf), tolerance);
    if (!mask) throw new Error('expected a mask for a non-empty key set');
    return mask;
};

describe('the names a scope accepts', () => {
    test('are every styling colour knob and every group their ids share, derived from the SDK', () => {
        expect(bloomScopeNames).toEqual(expect.arrayContaining([...stylingColorKnobIds]));
        expect(bloomScopeNames).toEqual(expect.arrayContaining(['traffic', 'traffic.flow', 'traffic.incidents']));
        expect(bloomScopeNames).toContain('colors');
        expect(bloomScopeNames).not.toContain('buildings.3d');
    });

    test('are the only entries besides CSS colours', () => {
        expect(invalidScopeEntry('traffic.incidents.majorColor')).toBeUndefined();
        expect(invalidScopeEntry('traffic')).toBeUndefined();
        expect(invalidScopeEntry('#1a73e8')).toBeUndefined();
        expect(invalidScopeEntry('hsl(0, 100%, 28%)')).toBeUndefined();
        expect(invalidScopeEntry('buildings.3d')).toMatch(/neither a CSS colour nor/);
        expect(invalidScopeEntry('places')).toMatch(/neither a CSS colour nor/);
        expect(invalidScopeEntry(3)).toMatch(/not a string/);
    });

    test('only a named entry needs the styling module', () => {
        expect(scopeReadsStyling(['#1a73e8', 'hsl(0, 100%, 28%)'])).toBe(false);
        expect(scopeReadsStyling(['#1a73e8', 'traffic'])).toBe(true);
    });
});

describe('scopeColors', () => {
    const styling = stylingWith({
        'traffic.flow.freeColor': '#00ff00',
        'traffic.flow.slowColor': '#ffa500',
        'traffic.incidents.minorColor': '#ffd400',
        // The notation the TomTom traffic palettes are actually written in.
        'traffic.incidents.majorColor': 'hsl(0, 100%, 50%)',
        'traffic.incidents.closedColor': 'darkred',
    });

    test('reads a knob by its id', () => {
        expect(scopeColors(styling, ['traffic.incidents.majorColor', 'traffic.incidents.closedColor'])).toEqual([
            [1, 0, 0, 1],
            [139 / 255, 0, 0, 1],
        ]);
    });

    test('reads every knob of a group, and no knob outside it', () => {
        expect(scopeColors(styling, ['traffic'])).toHaveLength(5);
        expect(scopeColors(styling, ['traffic.flow'])).toEqual([
            [0, 1, 0, 1],
            [1, 165 / 255, 0, 1],
        ]);
    });

    // What the styling module does not paint — a route line in its own `mainColor` — is given outright.
    test('takes a CSS colour as it is, beside the named entries', () => {
        expect(scopeColors(undefined, ['#0000ff'])).toEqual([[0, 0, 1, 1]]);
        expect(scopeColors(styling, ['traffic.incidents.majorColor', '#0000ff'])).toEqual([
            [1, 0, 0, 1],
            [0, 0, 1, 1],
        ]);
    });

    test('keys named entries on nothing until the catalogue arrives', () => {
        expect(scopeColors(undefined, ['traffic'])).toEqual([]);
    });

    test('skips a colour the style paints with an expression no literal stands for', () => {
        const unreadable = stylingWith({ 'traffic.incidents.majorColor': undefined });
        expect(scopeColors(unreadable, ['traffic.incidents.majorColor'])).toEqual([]);
    });
});

describe('buildScopeMask', () => {
    const green: Pixel = [0, 200, 0];

    test('keeps a scoped colour and drops the grey city around it', () => {
        const mask = maskOf([green], 0.25);

        expect(lit(mask, green)).toBe(true);
        expect(lit(mask, [128, 128, 128])).toBe(false);
        expect(lit(mask, [255, 0, 0])).toBe(false);
    });

    test('keeps a dimmed edge of a scoped colour, because brightness is the threshold’s business', () => {
        expect(lit(maskOf([green], 0.25), [0, 60, 0])).toBe(true);
    });

    test('has nothing to key on without colours', () => {
        expect(buildScopeMask([], 0.25)).toBeUndefined();
    });
});

// The literals `monoDark` paints these two jam levels in, 0.217 apart in chromaticity.
describe('separating one jam severity from the next', () => {
    const major: Pixel = [143, 0, 0];
    const moderate: Pixel = [218, 46, 11];
    const defaultTolerance = effectKnobDefinitions['bloom.onlyTolerance'].default;

    test('keeps a moderate jam out of a major-jam scope at the default tolerance', () => {
        expect(lit(maskOf([major], defaultTolerance), moderate)).toBe(false);
        expect(lit(maskOf([major], defaultTolerance), major)).toBe(true);
    });

    test('lets it back in once the tolerance passes the 0.217 that separates them', () => {
        expect(lit(maskOf([major], 0.25), moderate)).toBe(true);
    });
});
