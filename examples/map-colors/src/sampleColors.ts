import type { MapColors, StandardStyleID } from '@tomtom-org/maps-sdk/map';

/**
 * One sample palette: the ten colours, and the standard style they are designed on top of. Every
 * shade is re-derived at the offset that style itself used, so a palette is a recolour rather than
 * an inversion, and a dark set belongs on the dark style.
 */
export type ColorSample = { style: StandardStyleID; colors: MapColors };

/**
 * Sample palettes, keyed by the name the dropdown shows. Each sets all ten in `hsl()`, so the
 * relationships TomTom's own light and dark styles are built on are readable in the numbers:
 *
 * - `land` and `artificial` differ by a few points of lightness and little else, so built-up areas
 *   read as a variation of the ground rather than a second surface.
 * - `water` carries most of the saturation; everything else stays below ~40%, which keeps a
 *   recoloured map quiet enough to put a UI on.
 * - `park` sits two or three points lighter than `vegetation` and slightly more saturated, in the
 *   same hue.
 * - `road` is the lightest road element with `roadOutline` well darker, so the casing still reads as
 *   a rim; `roadMajor` sits between the two, or carries the one warm accent.
 * - `label` keeps some 60 points of lightness from `land`, and `labelOutline` matches `land` — a halo
 *   separates text from the ground, it is not meant to be seen.
 */
export const sampleColors: Record<string, ColorSample> = {
    Nordic: {
        style: 'standardLight',
        colors: {
            land: 'hsl(210, 20%, 96%)',
            water: 'hsl(205, 48%, 78%)',
            vegetation: 'hsl(150, 22%, 85%)',
            park: 'hsl(150, 26%, 87%)',
            artificial: 'hsl(210, 16%, 93%)',
            roadMajor: 'hsl(210, 32%, 72%)',
            road: 'hsl(0, 0%, 100%)',
            roadOutline: 'hsl(212, 20%, 78%)',
            label: 'hsl(213, 24%, 28%)',
            labelOutline: 'hsl(0, 0%, 100%)',
        },
    },
    Sandstone: {
        style: 'standardLight',
        colors: {
            land: 'hsl(38, 36%, 93%)',
            water: 'hsl(196, 40%, 76%)',
            vegetation: 'hsl(92, 26%, 81%)',
            park: 'hsl(92, 30%, 83%)',
            artificial: 'hsl(34, 24%, 90%)',
            roadMajor: 'hsl(24, 54%, 72%)',
            road: 'hsl(40, 50%, 99%)',
            roadOutline: 'hsl(30, 26%, 79%)',
            label: 'hsl(28, 28%, 27%)',
            labelOutline: 'hsl(40, 50%, 99%)',
        },
    },
    Harbour: {
        style: 'standardLight',
        colors: {
            land: 'hsl(192, 20%, 96%)',
            water: 'hsl(192, 52%, 74%)',
            vegetation: 'hsl(162, 26%, 84%)',
            park: 'hsl(162, 30%, 86%)',
            artificial: 'hsl(192, 15%, 93%)',
            roadMajor: 'hsl(199, 38%, 73%)',
            road: 'hsl(0, 0%, 100%)',
            roadOutline: 'hsl(195, 22%, 78%)',
            label: 'hsl(198, 30%, 25%)',
            labelOutline: 'hsl(0, 0%, 100%)',
        },
    },
    Heather: {
        style: 'standardLight',
        colors: {
            land: 'hsl(282, 16%, 96%)',
            water: 'hsl(218, 40%, 80%)',
            vegetation: 'hsl(128, 18%, 86%)',
            park: 'hsl(128, 22%, 88%)',
            artificial: 'hsl(282, 12%, 93%)',
            roadMajor: 'hsl(288, 26%, 77%)',
            road: 'hsl(0, 0%, 100%)',
            roadOutline: 'hsl(285, 16%, 80%)',
            label: 'hsl(285, 22%, 28%)',
            labelOutline: 'hsl(0, 0%, 100%)',
        },
    },
    Moss: {
        style: 'standardLight',
        colors: {
            land: 'hsl(66, 26%, 95%)',
            water: 'hsl(196, 40%, 77%)',
            vegetation: 'hsl(105, 30%, 79%)',
            park: 'hsl(105, 34%, 81%)',
            artificial: 'hsl(66, 18%, 92%)',
            roadMajor: 'hsl(82, 30%, 72%)',
            road: 'hsl(60, 30%, 99%)',
            roadOutline: 'hsl(90, 20%, 77%)',
            label: 'hsl(95, 26%, 23%)',
            labelOutline: 'hsl(60, 30%, 99%)',
        },
    },
    Graphite: {
        style: 'standardLight',
        colors: {
            land: 'hsl(220, 8%, 95%)',
            water: 'hsl(220, 14%, 83%)',
            vegetation: 'hsl(220, 6%, 89%)',
            park: 'hsl(220, 8%, 91%)',
            artificial: 'hsl(220, 6%, 92%)',
            roadMajor: 'hsl(220, 10%, 75%)',
            road: 'hsl(0, 0%, 100%)',
            roadOutline: 'hsl(220, 10%, 81%)',
            label: 'hsl(220, 12%, 32%)',
            labelOutline: 'hsl(0, 0%, 100%)',
        },
    },
    Slate: {
        style: 'standardDark',
        colors: {
            land: 'hsl(215, 12%, 12%)',
            water: 'hsl(210, 26%, 32%)',
            vegetation: 'hsl(170, 16%, 19%)',
            park: 'hsl(170, 18%, 21%)',
            artificial: 'hsl(215, 10%, 14%)',
            roadMajor: 'hsl(210, 12%, 48%)',
            road: 'hsl(212, 6%, 33%)',
            roadOutline: 'hsl(214, 14%, 13%)',
            label: 'hsl(210, 10%, 88%)',
            labelOutline: 'hsl(214, 16%, 10%)',
        },
    },
    Midnight: {
        style: 'standardDark',
        colors: {
            land: 'hsl(222, 28%, 12%)',
            water: 'hsl(214, 42%, 30%)',
            vegetation: 'hsl(180, 22%, 17%)',
            park: 'hsl(180, 24%, 19%)',
            artificial: 'hsl(222, 22%, 14%)',
            roadMajor: 'hsl(36, 40%, 52%)',
            road: 'hsl(218, 10%, 34%)',
            roadOutline: 'hsl(222, 26%, 13%)',
            label: 'hsl(214, 16%, 88%)',
            labelOutline: 'hsl(222, 30%, 10%)',
        },
    },
};
