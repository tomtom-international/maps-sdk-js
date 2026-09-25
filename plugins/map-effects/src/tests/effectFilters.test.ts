import { describe, expect, test } from 'vitest';
import {
    bloomFilter,
    defocusFilter,
    defocusUniforms,
    depthRamp,
    fogBlurPx,
    fogGradeFilter,
    fogVeil,
    gradeFilter,
    rimMask,
    vignetteGradient,
} from '../effectFilters';
import { effectKnobDefinitions, effectKnobIds } from '../effectsCatalogue';
import { withDefaults } from '../effectValues';
import { DEFOCUS_SHADER } from '../gpu/defocusShader';
import FRAGMENT_PREAMBLE from '../gpu/glsl/fragmentPreamble.glsl?raw';
import VERTEX_SHADER from '../gpu/glsl/screenPass.vert.glsl?raw';

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
        expect(defocusFilter(12)).toBe('blur(12px) saturate(1.08)');
        expect(defocusFilter(12)).not.toContain('brightness');
    });
});

describe('depth of field', () => {
    // MapLibre's own default vertical field of view, which is what makes the 45° case come out round.
    const DEFAULT_FOV = 36.87;
    const RASTER = { width: 1280, height: 900, scale: 2 };
    const KNOBS = { focus: 0.5, band: 0.3, blurCssPx: 18, bokeh: 0.5 };

    test('the depth of the frame is one number, and a tilt of 45 degrees doubles the far distance', () => {
        // span = 2·tan(fov/2)·tan(45°) = 2/3, ramp = span/(1 + span/2) = 0.5: the top of the picture
        // is twice as far away as the bottom.
        expect(depthRamp({ pitch: 45, verticalFieldOfView: DEFAULT_FOV })).toBeCloseTo(0.5, 4);
        expect(depthRamp({ pitch: 60, verticalFieldOfView: DEFAULT_FOV })).toBeGreaterThan(0.7);
        // Steeper tilts run away faster, as distance through a lens does.
        expect(depthRamp({ pitch: 80, verticalFieldOfView: DEFAULT_FOV })).toBeGreaterThan(
            depthRamp({ pitch: 70, verticalFieldOfView: DEFAULT_FOV }),
        );
    });

    test('a map seen from straight above has no depth, so the pass has nothing to run', () => {
        expect(depthRamp({ pitch: 0, verticalFieldOfView: DEFAULT_FOV })).toBe(0);
        expect(defocusUniforms(KNOBS, { pitch: 0, verticalFieldOfView: DEFAULT_FOV }, RASTER)).toBeUndefined();
        // Nothing checks the pitch: the geometry is what ends the effect.
        expect(defocusUniforms(KNOBS, { pitch: 0.2, verticalFieldOfView: DEFAULT_FOV }, RASTER)?.uDepth).toBeLessThan(
            0.01,
        );
        // An intensity of zero is the effect switched off, whatever the camera is doing.
        expect(
            defocusUniforms({ ...KNOBS, blurCssPx: 0 }, { pitch: 60, verticalFieldOfView: DEFAULT_FOV }, RASTER),
        ).toBeUndefined();
    });

    test('the plane of focus is read across what the frame shows, and held at the horizon', () => {
        const camera = { pitch: 45, verticalFieldOfView: DEFAULT_FOV };
        // ramp is 0.5 here, so focus 1 is the farthest the frame shows rather than infinity.
        expect(defocusUniforms({ ...KNOBS, focus: 0 }, camera, RASTER)?.uFocus).toBe(0);
        expect(defocusUniforms({ ...KNOBS, focus: 1 }, camera, RASTER)?.uFocus).toBeCloseTo(0.5, 4);
        // A tilt steep enough to put the horizon on screen cannot focus past it.
        expect(
            defocusUniforms({ ...KNOBS, focus: 1 }, { pitch: 80, verticalFieldOfView: DEFAULT_FOV }, RASTER)?.uFocus,
        ).toBe(1);
    });

    test('only the blur takes the raster scale, which is how a capture matches the screen', () => {
        const camera = { pitch: 60, verticalFieldOfView: DEFAULT_FOV };
        const screen = defocusUniforms(KNOBS, camera, RASTER);
        const print = defocusUniforms(KNOBS, camera, { width: 3840, height: 2700, scale: 6 });
        expect(screen?.uBlur).toBe(36);
        expect(print?.uBlur).toBe(108);
        // The geometry is angles and ratios, so it reads the same at any resolution.
        expect(print?.uDepth).toBe(screen?.uDepth);
        expect(print?.uFocus).toBe(screen?.uFocus);
        expect(print?.uBand).toBe(screen?.uBand);
    });

    test('a texel is one over the raster, so an offset in device pixels is a UV step', () => {
        const uniforms = defocusUniforms(KNOBS, { pitch: 60, verticalFieldOfView: DEFAULT_FOV }, RASTER);
        expect(uniforms?.uTexel).toEqual([1 / 1280, 1 / 900]);
    });
});

describe('the defocus program', () => {
    test('declares every uniform the stage binds, under the same names', () => {
        const uniforms = defocusUniforms(
            { focus: 0.5, band: 0.3, blurCssPx: 18, bokeh: 0.5 },
            { pitch: 60, verticalFieldOfView: 36.87 },
            { width: 100, height: 100, scale: 1 },
        );
        for (const name of Object.keys(uniforms ?? {})) {
            expect(DEFOCUS_SHADER).toContain(`uniform ${name === 'uTexel' ? 'vec2' : 'float'} ${name};`);
        }
    });

    test('carries no version directive, which the substrate prepends with the rest of the preamble', () => {
        expect(DEFOCUS_SHADER).not.toContain('#version');
        expect(DEFOCUS_SHADER).toContain('void main()');
    });
});

describe("the substrate's shaders", () => {
    /**
     * ANGLE rejects even a comment before `#version`, and the whole program then fails to compile —
     * which shows up as a map the effects never touched rather than as an error the caller sees. The
     * two files carry their explanation *after* the directive for exactly that reason, so a header
     * moved back above it has to fail here.
     */
    test('open with the version directive on the literal first line', () => {
        for (const source of [VERTEX_SHADER, FRAGMENT_PREAMBLE]) {
            expect(source.split('\n')[0]).toBe('#version 300 es');
            expect(source.match(/#version/g)).toHaveLength(1);
        }
    });
});

describe('catalogue', () => {
    test('every effect is off by default and every knob has a kind from the SDK knob vocabulary', () => {
        const values = withDefaults({});
        expect(values['bloom.intensity']).toBe(0);
        expect(values['tint.opacity']).toBe(0);
        expect(values['vignette.intensity']).toBe(0);
        expect(values['fog.intensity']).toBe(0);
        expect(values['edgeBlur.intensity']).toBe(0);
        expect(values['depthOfField.intensity']).toBe(0);
        expect(gradeFilter(values['grade.brightness'], values['grade.contrast'], values['grade.saturation'])).toBe('');
        expect(values['bloom.only']).toEqual([]);
        for (const id of effectKnobIds) {
            expect(['number', 'color', 'colors']).toContain(effectKnobDefinitions[id].kind);
            expect(effectKnobDefinitions[id].useCase.length).toBeGreaterThan(0);
        }
    });
});
