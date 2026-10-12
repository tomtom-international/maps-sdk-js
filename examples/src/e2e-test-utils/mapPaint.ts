import type { Frame, Page } from '@playwright/test';
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
 * Share of the sampled pixels that may change between two samples of a map still counted as still.
 *
 * A pitched 3D terrain map keeps streaming its far tiles for half a minute on a loaded runner, each
 * repainting under 1% of the sample, while the swaps that matter repaint far more: a mesh rebuilt
 * from finer elevation tiles moves 20 to 90% of it, and ground still waiting on its imagery shows a
 * third of the frame grey.
 */
const STILL_CHANGE_RATIO = 0.01;

/**
 * Makes WebGL canvases keep their drawing buffer, so their pixels can be read back after a frame.
 *
 * Must be installed before the page's own script runs, and reaches its iframes too. MapLibre asks
 * for the default `preserveDrawingBuffer: false`, under which drawing the canvas into a 2D context
 * yields blank — the same flag `MapEffects.capture` requires of consumers for the same reason.
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
 *
 * @param target - The page, or the frame the map lives in.
 * @param ceiling - Cap on `timeout`. Raise it only for a test that budgets for a slower renderer.
 */
export const waitForMapPainted = async (
    target: Page | Frame,
    timeout: number,
    ceiling = PAINT_TIMEOUT_MS,
): Promise<void> => {
    await expect
        .poll(async () => countColours(await sampleMapCanvases(target)), {
            timeout: Math.min(timeout, ceiling),
            intervals: [250, 500, 1000],
            message:
                'Every map canvas on the page is a single flat colour, so the map drew nothing to ' +
                'snapshot. A page with no canvas at all never got as far as constructing MapLibre.',
        })
        .toBeGreaterThan(1);
};

/**
 * Waits until the map canvases have held still for `quietMs`, as {@link STILL_CHANGE_RATIO} counts it.
 *
 * `toHaveScreenshot` accepts two matching frames 100ms apart, which a map still waiting on its tiles
 * passes too: between two arrivals it does not change. Holding still for seconds is what tells a
 * map that finished drawing from one that is still building its picture.
 *
 * @param target - The page, or the frame the map lives in.
 * @param ceiling - Cap on `timeout`, as for {@link waitForMapPainted}.
 */
export const waitForMapStill = async (
    target: Page | Frame,
    quietMs: number,
    timeout: number,
    ceiling = PAINT_TIMEOUT_MS,
): Promise<void> => {
    let previous: number[] = [];
    let stillSince = Date.now();
    await expect
        .poll(
            async () => {
                const current = (await sampleMapCanvases(target)).flat();
                if (changedShare(previous, current) > STILL_CHANGE_RATIO) stillSince = Date.now();
                previous = current;
                return Date.now() - stillSince;
            },
            {
                timeout: Math.min(timeout, ceiling),
                intervals: [500],
                message: `The map never held still for ${quietMs}ms, so there is no settled picture to snapshot.`,
            },
        )
        .toBeGreaterThanOrEqual(quietMs);
};

/** The share of sampled pixels that differ between two samples; all of them when their sizes differ. */
const changedShare = (previous: number[], current: number[]): number =>
    previous.length === current.length && current.length > 0
        ? current.filter((colour, index) => colour !== previous[index]).length / current.length
        : 1;

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
const countColours = (samples: number[][]): number => Math.max(0, ...samples.map((sample) => new Set(sample).size));

/** Each map canvas on the page, downsampled and quantised to one colour number per sampled pixel. */
const sampleMapCanvases = (target: Page | Frame): Promise<number[][]> =>
    target.evaluate(
        ({ edge, noiseBits }) => {
            const sample = document.createElement('canvas');
            sample.width = edge;
            sample.height = edge;
            const context = sample.getContext('2d', { willReadFrequently: true });
            if (!context) return [];

            return [...document.querySelectorAll<HTMLCanvasElement>('canvas.maplibregl-canvas')].map((canvas) => {
                if (canvas.width === 0 || canvas.height === 0) return [];
                context.drawImage(canvas, 0, 0, edge, edge);
                const { data } = context.getImageData(0, 0, edge, edge);

                const colours: number[] = [];
                for (let index = 0; index < data.length; index += 4) {
                    const red = data[index] >> noiseBits;
                    const green = data[index + 1] >> noiseBits;
                    const blue = data[index + 2] >> noiseBits;
                    colours.push((red << 16) | (green << 8) | blue);
                }
                return colours;
            });
        },
        { edge: SAMPLE_EDGE, noiseBits: CHANNEL_NOISE_BITS },
    );
