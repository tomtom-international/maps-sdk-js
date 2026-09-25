/**
 * What a shot is measured by.
 *
 * Every number here is taken off a **screenshot** rather than off a canvas read-back, and that is
 * the reason this suite needs a browser at all: `backdrop-filter` and `mix-blend-mode` live in the
 * compositor and appear in no element's own pixels, so a canvas cannot answer whether an overlay
 * did anything. Playwright takes the photograph; the arithmetic happens here, in the page, because
 * the page is where a PNG can be decoded without adding a decoder to the repo.
 *
 * @module
 */

/** A shot's level and how far its pixels sit from it. */
export type Stats = { mean: number; spread: number };

/**
 * A statistic per third of the frame's height. **Near is the bottom**, which is what a tilted
 * camera gives: the ground runs away from the lens up the picture.
 */
export type Bands = { near: number; middle: number; far: number };

export type ShotMetrics = Stats & {
    /** Mean of each channel, for the claims about colour rather than light. */
    red: number;
    green: number;
    blue: number;
    /** Mean distance from grey (brightest channel − dimmest) — the one statistic a saturation claim lives in. */
    chroma: number;
    /**
     * How many times the picture changes direction along an average row of each band: light to dark
     * to light, counting only steps big enough to be a mark.
     *
     * Not edge energy, which cannot see a defocus: a blur *lowers* total contrast, but so does a
     * picture that was simply darker. What a lens destroys is marks, and a mark is a reversal.
     */
    sharpness: Bands;
    /** Mean brightness of each band, for the pair that differ only in what a highlight is worth. */
    brightness: Bands;
};

/** How far two shots differ on the optical axis and in the corners. */
export type RimDifference = { axis: number; corners: number };

// Below this, a step along a row is the encoder's noise rather than a mark.
const REVERSAL_THRESHOLD = 8;

// The two rings `rimDifference` reads: the middle of the frame, and the corners. Normalised so 1 is
// the corner, which is where every rim effect in the catalogue reaches full strength.
const AXIS_FIELD = 0.3;
const CORNER_FIELD = 0.85;

const decode = async (shot: string): Promise<ImageData> => {
    const image = new Image();
    image.src = `data:image/png;base64,${shot}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no 2d context to measure a shot in');

    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
};

// Bytes per pixel in an `ImageData`, and the three of them a statistic here reads: every shot is
// opaque, so nothing weights by alpha.
const PIXEL_STRIDE = 4;
const CHANNELS = 3;

const greyOf = (data: Uint8ClampedArray, at: number): number => (data[at] + data[at + 1] + data[at + 2]) / CHANNELS;

const greyAt = ({ data, width }: ImageData, x: number, y: number): number =>
    greyOf(data, (y * width + x) * PIXEL_STRIDE);

const pixelCountOf = ({ data }: ImageData): number => data.length / PIXEL_STRIDE;

// An average over however many samples were actually taken, and 0 where none were — the shape every
// statistic below ends in, since a band or a ring can be empty at a small enough frame.
const meanOf = (total: number, counted: number): number => (counted ? total / counted : 0);

// Rows [fromRow, toRow) as thirds of the height, near first — see `Bands`.
const bandsOf = (height: number): [number, number][] => {
    const third = Math.floor(height / 3);
    return [
        [height - third, height],
        [third, height - third],
        [0, third],
    ];
};

const reversalsPerRow = (image: ImageData, fromRow: number, toRow: number): number => {
    let reversals = 0;
    for (let y = fromRow; y < toRow; y++) {
        let direction = 0;
        for (let x = 1; x < image.width; x++) {
            const step = greyAt(image, x, y) - greyAt(image, x - 1, y);
            if (Math.abs(step) < REVERSAL_THRESHOLD) continue;

            const next = step > 0 ? 1 : -1;
            if (next !== direction) reversals++;
            direction = next;
        }
    }
    return meanOf(reversals, toRow - fromRow);
};

const meanOfRows = (image: ImageData, fromRow: number, toRow: number): number => {
    let total = 0;
    for (let y = fromRow; y < toRow; y++) {
        for (let x = 0; x < image.width; x++) total += greyAt(image, x, y);
    }
    return meanOf(total, (toRow - fromRow) * image.width);
};

const greyStats = (image: ImageData): Stats => {
    const { data } = image;
    let total = 0;
    let squared = 0;
    for (let at = 0; at < data.length; at += PIXEL_STRIDE) {
        const grey = greyOf(data, at);
        total += grey;
        squared += grey * grey;
    }

    const pixels = pixelCountOf(image);
    const mean = meanOf(total, pixels);
    return { mean, spread: Math.sqrt(Math.max(meanOf(squared, pixels) - mean * mean, 0)) };
};

const channelMeans = (image: ImageData): Pick<ShotMetrics, 'red' | 'green' | 'blue'> => {
    const { data } = image;
    const totals = [0, 0, 0];
    for (let at = 0; at < data.length; at += PIXEL_STRIDE) {
        for (let channel = 0; channel < CHANNELS; channel++) totals[channel] += data[at + channel];
    }

    const pixels = pixelCountOf(image);
    return { red: meanOf(totals[0], pixels), green: meanOf(totals[1], pixels), blue: meanOf(totals[2], pixels) };
};

const chromaOf = (image: ImageData): number => {
    const { data } = image;
    let total = 0;
    for (let at = 0; at < data.length; at += PIXEL_STRIDE) {
        const [red, green, blue] = [data[at], data[at + 1], data[at + 2]];
        total += Math.max(red, green, blue) - Math.min(red, green, blue);
    }
    return meanOf(total, pixelCountOf(image));
};

const perBand = (image: ImageData, measure: (image: ImageData, fromRow: number, toRow: number) => number): Bands => {
    const [near, middle, far] = bandsOf(image.height);
    return { near: measure(image, ...near), middle: measure(image, ...middle), far: measure(image, ...far) };
};

/** Every scalar one shot can answer for, from a single decode. */
export const metricsOf = async (shot: string): Promise<ShotMetrics> => {
    const image = await decode(shot);
    return {
        ...greyStats(image),
        ...channelMeans(image),
        chroma: chromaOf(image),
        sharpness: perBand(image, reversalsPerRow),
        brightness: perBand(image, meanOfRows),
    };
};

// Which of the two rings a pixel belongs to, if either. `undefined` is the annulus between them,
// where no rim effect is asked to have landed and nothing is measured.
const ringAt = (field: number): keyof RimDifference | undefined => {
    if (field <= AXIS_FIELD) return 'axis';
    if (field >= CORNER_FIELD) return 'corners';

    return undefined;
};

// How far a pixel sits from the centre of the frame, as a fraction of the way to a corner. Closed
// over the frame's own geometry, which is asked once rather than per pixel.
const fieldOf = ({ width, height }: ImageData) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const corner = Math.hypot(halfWidth, halfHeight);
    return (x: number, y: number) => Math.hypot(x + 0.5 - halfWidth, y + 0.5 - halfHeight) / corner;
};

// The total absolute difference across one pixel's colour channels.
const channelDifferenceAt = (one: ImageData, two: ImageData, at: number): number => {
    let total = 0;
    for (let channel = 0; channel < CHANNELS; channel++) {
        total += Math.abs(one.data[at + channel] - two.data[at + channel]);
    }
    return total;
};

/**
 * How far two shots differ near the optical axis and in the corners, per colour channel.
 *
 * Radial rather than banded, because a rim effect is radial and a band cannot tell the two apart: a
 * horizontal strip through the middle of the frame holds both the untouched centre and the two most
 * affected edges of that row, so it averages the whole claim away.
 */
export const rimDifference = async (first: string, second: string): Promise<RimDifference> => {
    const [one, two] = await Promise.all([decode(first), decode(second)]);
    if (one.width !== two.width || one.height !== two.height) {
        throw new Error('the two shots were photographed at different sizes');
    }

    const fieldAt = fieldOf(one);
    const totals = { axis: 0, corners: 0 };
    const counted = { axis: 0, corners: 0 };
    for (let y = 0; y < one.height; y++) {
        for (let x = 0; x < one.width; x++) {
            const ring = ringAt(fieldAt(x, y));
            if (!ring) continue;

            totals[ring] += channelDifferenceAt(one, two, (y * one.width + x) * PIXEL_STRIDE);
            counted[ring] += CHANNELS;
        }
    }
    return {
        axis: meanOf(totals.axis, counted.axis),
        corners: meanOf(totals.corners, counted.corners),
    };
};
