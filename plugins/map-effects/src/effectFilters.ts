/**
 * The maths behind every effect, as pure functions: CSS filter strings and gradient descriptions the
 * live overlays use through `backdrop-filter`, and the same values the capture path feeds into a 2D
 * canvas. One implementation, two consumers — never a live/export pair that can drift.
 *
 * @module
 * @ignore
 */

import type { LightDark } from '@tomtom-org/maps-sdk/map';

// The threshold's usable ceiling: at 1 the contrast term would divide by zero.
const BLOOM_CUT_MAX = 0.92;
const BLOOM_SATURATE = 1.35;

// Knob values arrive validated against the catalogue, so this only guards the maths against a
// caller reaching these functions directly.
const asFraction = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * The filter chain that turns the map underneath into its own glow: cut, spread, saturate.
 *
 * `brightness` and `contrast` together are the threshold, and the pair is exact: `contrast(c)`
 * scales each channel away from 0.5 and `brightness(b)` scales it from 0, so the two compose to
 * `(in·b − 0.5)·c + 0.5`. Asking that line to send `cut` to 0 and 1 to 1 solves to
 * `b = 1/(1 + cut)`, `c = (1 + cut)/(1 − cut)`. Per channel, not luminance, so a magenta road
 * blooms magenta instead of bleeding grey.
 *
 * @param scale - Device pixels per CSS pixel of the canvas the filter runs on, so the radius is in
 * CSS pixels wherever it is applied.
 * @ignore
 */
export const bloomFilter = (radius: number, threshold: number, scale = 1): string => {
    const cut = asFraction(threshold) * BLOOM_CUT_MAX;
    const brightness = 1 / (1 + cut);
    const contrast = (1 + cut) / (1 - cut);
    return `brightness(${brightness.toFixed(4)}) contrast(${contrast.toFixed(3)}) blur(${radius * scale}px) saturate(${BLOOM_SATURATE})`;
};

/**
 * The colour grade as a CSS filter, or an empty string when every term is at its neutral value.
 * @ignore
 */
export const gradeFilter = (brightness: number, contrast: number, saturation: number): string =>
    [
        brightness === 1 ? '' : `brightness(${brightness})`,
        contrast === 1 ? '' : `contrast(${contrast})`,
        saturation === 1 ? '' : `saturate(${saturation})`,
    ]
        .filter(Boolean)
        .join(' ');

/**
 * Every rim effect — vignette, fog veil, mask — paints the same ellipse: the inner colour out to
 * where `reach` starts it, the outer colour at the corners. The capture path fills the same pair
 * onto a canvas gradient, so the two cannot drift.
 * @ignore
 */
export const rimGradient = (inner: string, outer: string, reach: number): string => {
    // Where the rim starts, as the percentage of the way from centre to corner.
    const innerStop = Math.round((1 - asFraction(reach)) * 100);
    return `radial-gradient(ellipse farthest-corner at center, ${inner} ${innerStop}%, ${outer} 100%)`;
};

/**
 * The radial gradient a vignette paints: transparent in the middle, darkening (negative intensity)
 * or lightening (positive) towards the corners.
 * @ignore
 */
export const vignetteGradient = (intensity: number, reach: number): string => {
    const { inner, outer } = vignetteStops(intensity);
    return rimGradient(inner, outer, reach);
};

/**
 * The two colours a vignette fades between: black towards the corners for a negative intensity,
 * white for a positive one. The capture path paints the same pair onto a canvas gradient.
 * @ignore
 */
export const vignetteStops = (intensity: number): { inner: string; outer: string } => {
    const rgb = intensity < 0 ? '0, 0, 0' : '255, 255, 255';
    return { inner: `rgba(${rgb}, 0)`, outer: `rgba(${rgb}, ${Math.min(Math.abs(intensity), 1)})` };
};

/**
 * A mask that keeps an effect to the rim of the view: transparent centre, opaque edges.
 * @ignore
 */
export const rimMask = (reach: number): string => rimGradient('transparent', 'black', reach);

// How opaque the fog veil gets at the corners, per unit of intensity.
const FOG_VEIL_ALPHA = 0.65;

// The fog's blur radius in CSS pixels: the softness the faintest fog already has, plus the span
// intensity spends on top of it.
const FOG_BLUR_BASE_PX = 2;
const FOG_BLUR_SPAN_PX = 6;

// The haze the fog veil is made of, and the grade under it, per light/dark theme of the map. Haze
// takes the colour of the light in the air: pale over a daylit map, and the map's own darkness over
// a dark one, where a pale veil would read as a bloom rather than as distance.
const FOG_BY_THEME: Record<LightDark, { rgb: string; grade: string }> = {
    light: { rgb: '238, 240, 244', grade: 'brightness(1.08) contrast(0.82) saturate(0.7)' },
    dark: { rgb: '16, 22, 33', grade: 'brightness(0.92) contrast(0.82) saturate(0.7)' },
};

/** Keeps blurred colours from greying out; used by both the live filter and the capture. @ignore */
export const EDGE_BLUR_SATURATE = 'saturate(1.08)';

/**
 * The grade under the fog blur, which washes the rim out towards the colour of the air.
 * @ignore
 */
export const fogGradeFilter = (lightDark: LightDark): string => FOG_BY_THEME[lightDark].grade;

/**
 * The fog's blur radius in CSS pixels for a given intensity.
 * @ignore
 */
export const fogBlurPx = (intensity: number): number => FOG_BLUR_BASE_PX + intensity * FOG_BLUR_SPAN_PX;

/**
 * The fog: a blur plus a washed-out grade over the rim, under a veil that thickens outwards.
 * @ignore
 */
export const fogFilter = (intensity: number, lightDark: LightDark): string =>
    `blur(${fogBlurPx(intensity)}px) ${fogGradeFilter(lightDark)}`;

/**
 * The two colours the fog veil fades between, for a given intensity.
 * @ignore
 */
export const fogVeilStops = (intensity: number, lightDark: LightDark): { inner: string; outer: string } => {
    const { rgb } = FOG_BY_THEME[lightDark];
    return { inner: `rgba(${rgb}, 0)`, outer: `rgba(${rgb}, ${intensity * FOG_VEIL_ALPHA})` };
};

/**
 * The veil over the fog blur, thickening towards the corners.
 * @ignore
 */
export const fogVeil = (intensity: number, reach: number, lightDark: LightDark): string => {
    const { inner, outer } = fogVeilStops(intensity, lightDark);
    return rimGradient(inner, outer, reach);
};

/**
 * The edge blur's filter: blur alone, with a slight saturation lift so blurred colours do not grey
 * out. Unlike {@link fogFilter} it neither washes the rim out nor lays a veil over it, so the rim
 * keeps its own colours and only loses its detail.
 * @ignore
 */
export const edgeBlurFilter = (intensity: number): string => `blur(${intensity}px) ${EDGE_BLUR_SATURATE}`;
