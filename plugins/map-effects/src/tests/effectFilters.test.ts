import { describe, expect, test } from 'vitest';
import {
    bloomFilter,
    edgeBlurFilter,
    fogBlurPx,
    fogGradeFilter,
    fogVeil,
    gradeFilter,
    rimMask,
    vignetteGradient,
} from '../effectFilters';
import { effectKnobDefinitions, effectKnobIds } from '../effectsCatalogue';
import { withDefaults } from '../effectValues';

describe('bloomFilter', () => {
    test('the brightness/contrast pair pins the threshold to black and white to white', () => {
        // b = 1/(1+cut) = 0.6849, c = (1+cut)/(1-cut) = 2.704 with cut = 0.5 × 0.92 = 0.46
        expect(bloomFilter(12, 0.5)).toBe('brightness(0.6849) contrast(2.704) blur(12px) saturate(1.35)');
        // Threshold 0: no cut, the map glows as it is.
        expect(bloomFilter(10, 0)).toContain('brightness(1.0000) contrast(1.000)');
    });

    test('the blur radius follows the canvas scale so it stays in CSS pixels', () => {
        expect(bloomFilter(12, 0.5, 0.5)).toContain('blur(6px)');
        expect(bloomFilter(12, 0.5, 3)).toContain('blur(36px)');
    });
});

describe('gradeFilter', () => {
    test('emits only the terms that changed, and nothing when all are neutral', () => {
        expect(gradeFilter(1, 1, 1)).toBe('');
        expect(gradeFilter(0.8, 1, 0.5)).toBe('brightness(0.8) saturate(0.5)');
    });
});

describe('rim effects', () => {
    test('reach sets where the rim starts, from the centre outwards', () => {
        expect(rimMask(0.4)).toContain('transparent 60%');
        expect(vignetteGradient(-0.5, 0.45)).toBe(
            'radial-gradient(ellipse farthest-corner at center, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.5) 100%)',
        );
        expect(vignetteGradient(0.3, 1)).toContain('rgba(255, 255, 255, 0) 0%');
        // The fog veil is the same ellipse, in the colour of the air.
        expect(fogVeil(0.5, 0.4, 'light')).toBe(
            'radial-gradient(ellipse farthest-corner at center, rgba(238, 240, 244, 0) 60%, rgba(238, 240, 244, 0.325) 100%)',
        );
        expect(fogBlurPx(0.5)).toBe(5);
    });

    test('haze takes the colour of the light in the air, so a dark map hazes dark', () => {
        // A pale veil over a dark map reads as a glow around the view rather than as distance.
        expect(fogVeil(0.5, 0.4, 'dark')).toContain('rgba(16, 22, 33, 0.325)');
        expect(fogGradeFilter('light')).toContain('brightness(1.08)');
        expect(fogGradeFilter('dark')).toContain('brightness(0.92)');
    });

    test('edge blur keeps the rim it blurs in its own colours, which is what separates it from fog', () => {
        // Fog washes the rim out and lays a veil over it; edge blur only takes the detail away.
        expect(edgeBlurFilter(12)).toBe('blur(12px) saturate(1.08)');
        expect(edgeBlurFilter(12)).not.toContain('brightness');
    });
});

describe('catalogue', () => {
    test('every effect is off by default and every knob has a kind the SDK styling catalogue knows', () => {
        const values = withDefaults({});
        expect(values['bloom.intensity']).toBe(0);
        expect(values['tint.opacity']).toBe(0);
        expect(values['vignette.intensity']).toBe(0);
        expect(values['fog.intensity']).toBe(0);
        expect(values['edgeBlur.intensity']).toBe(0);
        expect(gradeFilter(values['grade.brightness'], values['grade.contrast'], values['grade.saturation'])).toBe('');
        for (const id of effectKnobIds) {
            expect(['number', 'color']).toContain(effectKnobDefinitions[id].kind);
            expect(effectKnobDefinitions[id].useCase.length).toBeGreaterThan(0);
        }
    });
});
