/**
 * Red, green, blue and alpha of a colour, each 0–1.
 * @ignore
 */
export type RGBAColor = [number, number, number, number];

type HSLColor = [number, number, number, number];

const normalizeAngle = (angle: number): number => {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
};

const hslToRgb = ([h, s, l, alpha]: HSLColor): RGBAColor => {
    const hue = normalizeAngle(h);
    const sat = s / 100;
    const lig = l / 100;
    const f = (n: number) => {
        const k = (n + hue / 30) % 12;
        const a = sat * Math.min(lig, 1 - lig);
        return lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4), alpha];
};

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(min, n), max);

const validateNumbers = (array: number[]): boolean => !array.some(Number.isNaN);

const parseHex = (hex: string): number => Number.parseInt(hex.padEnd(2, hex), 16) / 255;

const parseAlpha = (a: number, asPercentage: string | undefined): number => clamp(asPercentage ? a / 100 : a, 0, 1);

const parseHexColor = (input: string): RGBAColor | undefined => {
    const hexRegexp = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
    if (!hexRegexp.test(input)) {
        return undefined;
    }
    const step = input.length < 6 ? 1 : 2;
    const r = parseHex(input.slice(1, 1 + step));
    const g = parseHex(input.slice(1 + step, 1 + step * 2));
    const b = parseHex(input.slice(1 + step * 2, 1 + step * 3));
    const a = parseHex(input.slice(1 + step * 3) || 'ff');
    return [r, g, b, a];
};

const RGB_REGEXP =
    /^rgba?\(\s*([\de.+-]+)(%)?(?:\s+|\s*(,)\s*)([\de.+-]+)(%)?(?:\s+|\s*(,)\s*)([\de.+-]+)(%)?(?:\s*([,/])\s*([\de.+-]+)(%)?)?\s*\)$/;

const parseRgbColor = (input: string): RGBAColor | undefined => {
    const rgbMatch = RGB_REGEXP.exec(input);
    if (!rgbMatch) {
        return undefined;
    }
    const [, r, rp, f1, g, gp, f2, b, bp, f3, a, ap] = rgbMatch;
    const argFormat = [f1 || ' ', f2 || ' ', f3].join('');
    if (argFormat !== '  ' && argFormat !== '  /' && argFormat !== ',,' && argFormat !== ',,,') {
        return undefined;
    }
    const valFormat = [rp, gp, bp].join('');
    const maxValue = valFormat === '%%%' ? 100 : valFormat === '' ? 255 : 0;
    if (!maxValue) {
        return undefined;
    }
    const rgba: RGBAColor = [
        clamp(+r / maxValue, 0, 1),
        clamp(+g / maxValue, 0, 1),
        clamp(+b / maxValue, 0, 1),
        a ? parseAlpha(+a, ap) : 1,
    ];
    return validateNumbers(rgba) ? rgba : undefined;
};

const HSL_REGEXP =
    /^hsla?\(\s*([\de.+-]+)(?:deg)?(?:\s+|\s*(,)\s*)([\de.+-]+)%(?:\s+|\s*(,)\s*)([\de.+-]+)%(?:\s*([,/])\s*([\de.+-]+)(%)?)?\s*\)$/;

const parseHslColor = (input: string): RGBAColor | undefined => {
    const hslMatch = HSL_REGEXP.exec(input);
    if (!hslMatch) {
        return undefined;
    }
    const [, h, f1, s, f2, l, f3, a, ap] = hslMatch;
    const argFormat = [f1 || ' ', f2 || ' ', f3].join('');
    if (argFormat !== '  ' && argFormat !== '  /' && argFormat !== ',,' && argFormat !== ',,,') {
        return undefined;
    }
    const hsla: HSLColor = [+h, clamp(+s, 0, 100), clamp(+l, 0, 100), a ? parseAlpha(+a, ap) : 1];
    return validateNumbers(hsla) ? hslToRgb(hsla) : undefined;
};

/**
 * Parses any CSS colour a map style writes — `#rgb`, `#rrggbb(aa)`, `rgb()`/`rgba()` in numbers or
 * percentages, `hsl()`/`hsla()`, `transparent` and the named colours — or `undefined` for a string
 * that is not one.
 * @ignore
 */
export const parseCssColor = (cssColor: string): RGBAColor | undefined => {
    const input = cssColor.toLowerCase().trim();

    if (input === 'transparent') {
        return [0, 0, 0, 0];
    }

    const namedColor = namedColors[input];
    if (namedColor) {
        const [r, g, b] = namedColor;
        return [r / 255, g / 255, b / 255, 1];
    }

    if (input.startsWith('#')) {
        return parseHexColor(input);
    }

    if (input.startsWith('rgb')) {
        return parseRgbColor(input);
    }

    return parseHslColor(input);
};

const rgbToHsl = ([r, g, b, alpha]: RGBAColor): HSLColor => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const delta = max - min;
    if (delta === 0) {
        return [0, 0, lightness * 100, alpha];
    }
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    let hue: number;
    if (max === r) {
        hue = ((g - b) / delta) % 6;
    } else if (max === g) {
        hue = (b - r) / delta + 2;
    } else {
        hue = (r - g) / delta + 4;
    }
    return [normalizeAngle(hue * 60), saturation * 100, lightness * 100, alpha];
};

/**
 * Hue (0–360), saturation (0–100) and lightness (0–100) of a CSS color, plus its alpha (0–1), or
 * `undefined` when the color cannot be parsed.
 * @ignore
 */
export const toHsl = (cssColor: string): HSLColor | undefined => {
    const parsed = parseCssColor(cssColor);
    return parsed && rgbToHsl(parsed);
};

/**
 * Whether a style value is a CSS colour outright, rather than an expression that produces one.
 * @ignore
 */
export const isColorLiteral = (value: unknown): value is string =>
    typeof value === 'string' && toHsl(value) !== undefined;

/**
 * Whether a style value is a colour literal that paints something. A fully transparent one is how a
 * style hides a feature, so it is no shade of any colour and nothing to re-derive.
 * @ignore
 */
export const isOpaqueColorLiteral = (value: unknown): value is string => {
    const hsl = typeof value === 'string' ? toHsl(value) : undefined;
    return hsl !== undefined && hsl[3] > 0;
};

/**
 * Formats hue/saturation/lightness/alpha back into a CSS `hsl()`/`hsla()` string, rounding to what
 * the map styles themselves use (whole degrees and percents).
 * @ignore
 */
export const formatHsl = ([hue, saturation, lightness, alpha]: HSLColor): string => {
    const h = Math.round(normalizeAngle(hue));
    const s = Math.round(clamp(saturation, 0, 100));
    const l = Math.round(clamp(lightness, 0, 100));
    return alpha < 1 ? `hsla(${h}, ${s}%, ${l}%, ${Math.round(alpha * 100) / 100})` : `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * The HSL offset that turns `fromColor` into `toColor`: how the map style derived one shade (an
 * outline, a tunnel variant) from another. Applying it to a new base colour with {@link shiftHsl}
 * re-derives the shade, so a recolour keeps the style's own shade relationships.
 * @ignore
 */
export type HslShift = { hue: number; saturation: number; lightness: number; alpha: number };

/**
 * @ignore
 */
export const hslShiftBetween = (fromColor: string, toColor: string): HslShift | undefined => {
    const from = toHsl(fromColor);
    const to = toHsl(toColor);
    if (!from || !to) {
        return undefined;
    }
    // A hue shift is meaningless when either colour is grey; keep the base hue then.
    const hue = from[1] < 1 || to[1] < 1 ? 0 : to[0] - from[0];
    return { hue, saturation: to[1] - from[1], lightness: to[2] - from[2], alpha: to[3] - from[3] };
};

/**
 * Applies an {@link HslShift} to a CSS color, clamping saturation and lightness to their ranges.
 * @ignore
 */
export const shiftHsl = (cssColor: string, shift: HslShift): string | undefined => {
    const hsl = toHsl(cssColor);
    if (!hsl) {
        return undefined;
    }
    return formatHsl([
        hsl[0] + shift.hue,
        hsl[1] + shift.saturation,
        hsl[2] + shift.lightness,
        clamp(hsl[3] + shift.alpha, 0, 1),
    ]);
};

/**
 * Relative luminance (WCAG 2.x definition, 0 = black, 1 = white) of a CSS color, or `undefined`
 * when the color cannot be parsed. Alpha is ignored.
 * @ignore
 */
export const relativeLuminance = (cssColor: string): number | undefined => {
    const parsed = parseCssColor(cssColor);
    if (!parsed) {
        return undefined;
    }
    const linear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear(parsed[0]) + 0.7152 * linear(parsed[1]) + 0.0722 * linear(parsed[2]);
};

/**
 * Darkens a CSS color by a given factor (0 = unchanged, 1 = black).
 * Accepts hex (#rgb, #rrggbb, #rrggbbaa), rgb(), hsl(), and CSS named colors.
 * Returns undefined if the color cannot be parsed.
 * @ignore
 */
export const darkenColor = (cssColor: string, darkenFactor: number): string | undefined => {
    const parsed = parseCssColor(cssColor);
    if (!parsed) {
        return undefined;
    }
    const brightnessScale = 1 - darkenFactor;
    return rgbToHex(parsed.slice(0, 3).map((channel) => channel * 255 * brightnessScale));
};

/**
 * Lightens a CSS color by a given factor (0 = unchanged, 1 = white).
 * Accepts hex (#rgb, #rrggbb, #rrggbbaa), rgb(), hsl(), and CSS named colors.
 * Returns undefined if the color cannot be parsed.
 * @ignore
 */
export const lightenColor = (cssColor: string, lightenFactor: number): string | undefined => {
    const parsed = parseCssColor(cssColor);
    if (!parsed) {
        return undefined;
    }
    return rgbToHex(parsed.slice(0, 3).map((channel) => (channel + (1 - channel) * lightenFactor) * 255));
};

/**
 * Formats red/green/blue channels (0–255, clamped and rounded) as a `#rrggbb` string.
 * @ignore
 */
export const rgbToHex = (rgb: number[]): string =>
    `#${rgb
        .map((channel) =>
            Math.round(clamp(channel, 0, 255))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('')}`;

/**
 * The shortest distance between two hues, in degrees (0–180). Two colours more than a hue family
 * apart are different colours rather than shades of one another.
 * @ignore
 */
export const hueDistance = (hue: number, otherHue: number): number => Math.abs(((hue - otherHue + 540) % 360) - 180);

/**
 * Below this saturation a colour reads as grey, and its hue carries no meaning — so a grey counts
 * as a shade of any colour.
 * @ignore
 */
export const GREY_SATURATION = 8;

const namedColors: Record<string, [number, number, number]> = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50],
};
