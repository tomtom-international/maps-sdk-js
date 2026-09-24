/**
 * Composites the effects onto a 2D canvas that already holds the rendered map — the capture path.
 * It consumes the same filter maths as the live overlays (`effectFilters.ts`), so what is captured is
 * what was on screen.
 *
 * @module
 * @ignore
 */

import type { LightDark } from '@tomtom-org/maps-sdk/map';
import {
    bloomFilter,
    EDGE_BLUR_SATURATE,
    fogBlurPx,
    fogGradeFilter,
    fogVeilStops,
    gradeFilter,
    vignetteStops,
} from './effectFilters';
import type { EffectValues } from './effectValues';

type Context = CanvasRenderingContext2D;

// A filtered copy of what `context` holds, on a canvas of its own — the capture equivalent of one
// `backdrop-filter` overlay. Undefined when the browser gives no 2D context for the scratch canvas.
const filteredCopy = (context: Context, width: number, height: number, filter: string): Context | undefined => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const copy = canvas.getContext('2d');
    if (!copy) return undefined;

    copy.filter = filter;
    copy.drawImage(context.canvas, 0, 0);
    copy.filter = 'none';
    return copy;
};

// Lays one such copy back over the capture, in the blend mode its live overlay uses.
const drawOver = (context: Context, layer: Context, operation: GlobalCompositeOperation, alpha = 1): void => {
    context.save();
    context.globalCompositeOperation = operation;
    context.globalAlpha = alpha;
    context.drawImage(layer.canvas, 0, 0);
    context.restore();
};

// Fills an elliptical radial gradient sized to the canvas aspect, like CSS's
// `ellipse farthest-corner at center`.
const fillEllipticalRadial = (
    context: Context,
    width: number,
    height: number,
    reach: number,
    innerColor: string,
    outerColor: string,
): void => {
    const radiusX = width / Math.SQRT2;
    const radiusY = height / Math.SQRT2;
    const gradient = context.createRadialGradient(0, 0, 1 - reach, 0, 0, 1);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(1, outerColor);
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(radiusX, radiusY);
    context.fillStyle = gradient;
    context.fillRect(-width / 2 / radiusX, -height / 2 / radiusY, width / radiusX, height / radiusY);
    context.restore();
};

// Blurs a copy of the canvas and keeps only its rim (transparent centre, opaque edges).
const applyRimBlur = (
    context: Context,
    width: number,
    height: number,
    scale: number,
    blurCssPx: number,
    reach: number,
    extraFilter: string,
): void => {
    const blurred = filteredCopy(context, width, height, `blur(${blurCssPx * scale}px) ${extraFilter}`.trim());
    if (!blurred) return;

    blurred.globalCompositeOperation = 'destination-in';
    fillEllipticalRadial(blurred, width, height, reach, 'rgba(0,0,0,0)', 'rgba(0,0,0,1)');
    context.drawImage(blurred.canvas, 0, 0);
};

// Draws the map's own glow back over it, the way the live bloom canvas blends in `screen` mode.
const applyBloom = (context: Context, width: number, height: number, scale: number, values: EffectValues): void => {
    const filter = bloomFilter(values['bloom.radius'], values['bloom.threshold'], scale);
    const glow = filteredCopy(context, width, height, filter);
    if (!glow) return;

    drawOver(context, glow, 'screen', values['bloom.intensity']);
};

// The colour grade replaces the pixels underneath, as a `backdrop-filter` overlay does.
const applyGrade = (context: Context, width: number, height: number, filter: string): void => {
    const graded = filteredCopy(context, width, height, filter);
    if (!graded) return;

    drawOver(context, graded, 'copy');
};

/**
 * Applies every active effect to `context`, in the same order the live overlays stack: bloom, grade,
 * fog, edge blur, tint, vignette. `scale` is device pixels per CSS pixel, so blur radii stay in CSS
 * pixels at any capture resolution.
 * @ignore
 */
export const compositeEffects = (
    context: Context,
    width: number,
    height: number,
    scale: number,
    values: EffectValues,
    lightDark: LightDark,
): void => {
    if (values['bloom.intensity'] > 0) applyBloom(context, width, height, scale, values);

    const grade = gradeFilter(values['grade.brightness'], values['grade.contrast'], values['grade.saturation']);
    if (grade) applyGrade(context, width, height, grade);

    if (values['fog.intensity'] > 0) {
        const intensity = values['fog.intensity'];
        const reach = values['fog.reach'];
        const { inner, outer } = fogVeilStops(intensity, lightDark);
        applyRimBlur(context, width, height, scale, fogBlurPx(intensity), reach, fogGradeFilter(lightDark));
        fillEllipticalRadial(context, width, height, reach, inner, outer);
    }
    if (values['edgeBlur.intensity'] > 0) {
        applyRimBlur(
            context,
            width,
            height,
            scale,
            values['edgeBlur.intensity'],
            values['edgeBlur.reach'],
            EDGE_BLUR_SATURATE,
        );
    }
    if (values['tint.opacity'] > 0) {
        context.save();
        context.globalAlpha = values['tint.opacity'];
        context.fillStyle = values['tint.color'];
        context.fillRect(0, 0, width, height);
        context.restore();
    }
    if (values['vignette.intensity'] !== 0) {
        const { inner, outer } = vignetteStops(values['vignette.intensity']);
        fillEllipticalRadial(context, width, height, values['vignette.reach'], inner, outer);
    }
};
