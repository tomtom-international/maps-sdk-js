/**
 * The synthetic map every case is shot over: a city drawn into a 2D canvas, with no tile, no
 * network call and no API key.
 *
 * Drawn rather than photographed because a real map's pixels are not the same twice. Tiles need a
 * key, so CI would shoot a blank canvas where a laptop shoots a city; traffic moves through the
 * day; a style release redraws it. None of those can be a baseline, and all of them would be read
 * as the effect having changed.
 *
 * @module
 */

/** The case's raster, in CSS pixels — the shot is taken at a device ratio of 1, so also in device pixels. */
export const SUBJECT_SIZE = 240;

// One repeat of the pattern. 240 is six of these and each third of the frame is exactly two, which
// is what lets the depth-of-field assertions compare the detail in one third against another: the
// subject has to carry the same amount of it at every height, or a lens that did nothing would
// still measure as sharper at the bottom.
const CELL = 40;

const STREET_WIDTH = 4;
const HIGHLIGHT_RADIUS = 3;

const GROUND = '#0d1117';
// Above any threshold these cases use: what bloom lifts and what a bokeh disc is made of. Also the
// stub map's traffic palette, which the bloom scopes key on.
export const STREET = '#4cc9f0';
export const CROSS_STREET = '#ff2e63';
// Below every threshold here, so a bloom case that lit these would be reading the wrong pixels.
const ALLEY = '#23304a';
const BLOCK = '#6d597a';
const HIGHLIGHT = '#fff3c4';

/**
 * Paints the subject: lit streets both ways, unlit alleys between them, a block and a street lamp
 * per cell.
 *
 * Thin strokes on a flat ground, because that is the subject the measurements need — every
 * statistic here counts marks, and a photograph of a soft landscape has few enough of them that a
 * defocus barely moves the number.
 */
export const paintSubject = (context: CanvasRenderingContext2D): void => {
    context.fillStyle = GROUND;
    context.fillRect(0, 0, SUBJECT_SIZE, SUBJECT_SIZE);

    context.fillStyle = ALLEY;
    for (let along = CELL / 2; along < SUBJECT_SIZE; along += CELL) {
        context.fillRect(along, 0, STREET_WIDTH + 2, SUBJECT_SIZE);
    }

    context.fillStyle = BLOCK;
    for (let x = CELL / 2 + 10; x < SUBJECT_SIZE; x += CELL) {
        for (let y = CELL / 2 + 8; y < SUBJECT_SIZE; y += CELL) context.fillRect(x, y, 16, 18);
    }

    context.fillStyle = STREET;
    for (let x = 8; x < SUBJECT_SIZE; x += CELL) context.fillRect(x, 0, STREET_WIDTH, SUBJECT_SIZE);
    context.fillStyle = CROSS_STREET;
    for (let y = 8; y < SUBJECT_SIZE; y += CELL) context.fillRect(0, y, SUBJECT_SIZE, STREET_WIDTH);

    // The lamps: small and much brighter than anything around them, so a gather that averages its
    // taps loses them and one that weights them keeps them. The bokeh pair is measured on these.
    context.fillStyle = HIGHLIGHT;
    for (let x = CELL - 8; x < SUBJECT_SIZE; x += CELL) {
        for (let y = CELL - 6; y < SUBJECT_SIZE; y += CELL) {
            context.beginPath();
            context.arc(x, y, HIGHLIGHT_RADIUS, 0, 2 * Math.PI);
            context.fill();
        }
    }
};
