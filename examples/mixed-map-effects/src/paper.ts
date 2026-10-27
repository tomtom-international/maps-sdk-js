import type { MapEffectsLayer } from '@tomtom-org/maps-sdk-plugin-map-effects';

/**
 * The paper the watercolour is painted on: its colour, a tile of its fibres for the pass to sample,
 * and the unpainted margin around the painting, drawn as a layer.
 */
export const PAPER_COLOR: [number, number, number] = [1, 0.96, 0.88];

const TILE_SIZE = 128;
const MARGIN = 18; // CSS px: how far in from the frame the paint stops, on average
const RAGGEDNESS = 0.8; // how far the paint's edge strays from it, as a share of the margin
const EDGE_STEP = 5; // CSS px between two points of that edge

// A seeded generator, so the paper is the same on every load.
const seededRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
};

/** One random grey per pixel: the GPU's linear filtering and repeat wrapping turn it into seamless fibres. */
// Image data rather than a canvas, which the plugin would upload again on every draw.
export const createPaperTile = (): ImageData => {
    const random = seededRandom(1);
    const pixels = new ImageData(TILE_SIZE, TILE_SIZE);
    for (let index = 0; index < pixels.data.length; index += 4) {
        const grey = random() * 255;
        pixels.data.set([grey, grey, grey, 255], index);
    }
    return pixels;
};

/** The paper left bare around the painting, with a ragged inner edge. */
export const drawPaperMargin: MapEffectsLayer['draw'] = (context, { width, height, pixelRatio }) => {
    const random = seededRandom(7);
    const margin = MARGIN * pixelRatio;
    const step = EDGE_STEP * pixelRatio;
    let inset = margin;
    const nextInset = () => {
        inset = inset * 0.6 + margin * (1 + (random() - 0.5) * 2 * RAGGEDNESS) * 0.4;
        return inset;
    };

    context.beginPath();
    context.rect(0, 0, width, height);
    context.moveTo(margin, margin);
    for (let x = margin; x < width - margin; x += step) context.lineTo(x, nextInset());
    for (let y = margin; y < height - margin; y += step) context.lineTo(width - nextInset(), y);
    for (let x = width - margin; x > margin; x -= step) context.lineTo(x, height - nextInset());
    for (let y = height - margin; y > margin; y -= step) context.lineTo(nextInset(), y);
    context.closePath();
    context.fillStyle = `rgb(${PAPER_COLOR.map((channel) => channel * 255).join(' ')})`;
    context.fill('evenodd');
};
