import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Edge of the square the canvas is downsampled to before measuring; detail survives, cost does not. */
const SAMPLE_EDGE = 96;

/**
 * Bits dropped from each colour channel before colours are counted as distinct.
 *
 * A map that failed to load is one flat colour — white before its style arrives, the style's
 * background after — so counting colours separates it from a drawn map without a threshold to
 * tune: a blocked map measures exactly 1, and the plainest example in the set measures 18 against
 * a median of 535. Quantising keeps that true if a renderer ever dithers its flat fill: shades
 * within eight levels of each other collapse into one, while anything drawn spans far more.
 */
const CHANNEL_NOISE_BITS = 3;

/**
 * Ceiling on the wait, kept under the 60s per-test budget so a map that never renders says so in
 * its own words instead of expiring as a bare test timeout, and so the three retries behind it cost
 * seconds rather than minutes.
 */
const PAINT_TIMEOUT_MS = 30_000;

/**
 * Makes WebGL canvases keep their drawing buffer, so their pixels can be read back after a frame.
 *
 * Must be installed before the page's own script runs. MapLibre asks for the default
 * `preserveDrawingBuffer: false`, under which drawing the canvas into a 2D context yields blank —
 * the same flag `MapEffects.capture` requires of consumers for the same reason.
 */
export const enableMapReadback = async (page: Page): Promise<void> => {
    await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
            this: HTMLCanvasElement,
            type: string,
            attributes?: Record<string, unknown>,
        ) {
            const readable =
                type === 'webgl' || type === 'webgl2' ? { ...attributes, preserveDrawingBuffer: true } : attributes;
            return Reflect.apply(getContext, this, [type, readable]);
        } as typeof getContext;
    });
};

/**
 * Waits until the map has actually drawn.
 *
 * `networkidle` cannot stand in for this: MapLibre fetches tiles from a web worker, and Playwright
 * does not count worker traffic towards the page being idle, so the wait returns on a canvas that
 * has drawn nothing. A flat canvas is perfectly steady, so `toHaveScreenshot` accepts its own shot
 * as final and fails it against the baseline rather than waiting the map out.
 *
 * It has to read the canvas rather than screenshot the map element, whose shot also carries any
 * panel the example floats over the map, contrast and all. Settling afterwards is left to
 * `toHaveScreenshot`, which already re-shoots until two frames match.
 *
 * The bar is "drew something", not "drew the right thing": a map that draws its route overlay over
 * missing tiles clears it and goes on to the comparison, which is the check that belongs to.
 */
export const waitForMapPainted = async (page: Page, timeout: number): Promise<void> => {
    await expect
        .poll(() => page.evaluate(countColours, { edge: SAMPLE_EDGE, noiseBits: CHANNEL_NOISE_BITS }), {
            timeout: Math.min(timeout, PAINT_TIMEOUT_MS),
            intervals: [250, 500, 1000],
            message:
                'Every map canvas on the page is a single flat colour, so the map drew nothing to ' +
                'snapshot. A page with no canvas at all never got as far as constructing MapLibre.',
        })
        .toBeGreaterThan(1);
};

/**
 * How many distinct colours the busiest map canvas on the page carries.
 *
 * A page with no canvas scores zero rather than passing by default: a map whose style never
 * arrives is never constructed, so "no canvas" is the loudest failure there is, not the absence of
 * a map to wait for. The examples that genuinely draw none say so through `rendersMap`.
 *
 * A page with several scores its best one, the grid examples already gating their own readiness on
 * the whole grid.
 */
const countColours = ({ edge, noiseBits }: { edge: number; noiseBits: number }): number => {
    const canvases = [...document.querySelectorAll<HTMLCanvasElement>('canvas.maplibregl-canvas')];
    if (canvases.length === 0) return 0;

    const sample = document.createElement('canvas');
    sample.width = edge;
    sample.height = edge;
    const context = sample.getContext('2d', { willReadFrequently: true });
    if (!context) return 0;

    const coloursIn = (canvas: HTMLCanvasElement): number => {
        if (canvas.width === 0 || canvas.height === 0) return 0;
        context.drawImage(canvas, 0, 0, edge, edge);
        const { data } = context.getImageData(0, 0, edge, edge);

        const colours = new Set<number>();
        for (let index = 0; index < data.length; index += 4) {
            const red = data[index] >> noiseBits;
            const green = data[index + 1] >> noiseBits;
            const blue = data[index + 2] >> noiseBits;
            colours.add((red << 16) | (green << 8) | blue);
        }
        return colours.size;
    };

    return Math.max(...canvases.map(coloursIn));
};
