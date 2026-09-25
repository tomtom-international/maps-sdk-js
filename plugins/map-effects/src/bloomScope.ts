/**
 * Scoping bloom to part of the map, by the colours that part is drawn in.
 *
 * - **Colour is what survives flattening**: the effects read one image with no layers in it.
 * - **Names come from the SDK**: every knob and group is derived from `stylingColorKnobIds`.
 * - **Brightness is not compared**: an antialiased edge and a lit centre are one colour at two
 *   levels, and `bloom.threshold` judges level.
 *
 * @module
 */

import {
    parseCssColor,
    type RGBAColor,
    type StylingColorKnobId,
    type StylingModule,
    stylingColorKnobIds,
} from '@tomtom-org/maps-sdk/map';

// Every dotted prefix of an id: `traffic` and `traffic.incidents` for `traffic.incidents.majorColor`.
type GroupsOf<ID extends string> = ID extends `${infer Head}.${infer Rest}`
    ? Head | `${Head}.${GroupsOf<Rest>}`
    : never;

/**
 * A family of colour knobs, named by the prefix their ids share — `traffic` for every traffic
 * colour, `traffic.incidents` for the incident severities, `colors` for the base map's own.
 *
 * @group Map Effects
 */
export type StylingColorKnobGroup = GroupsOf<StylingColorKnobId>;

/**
 * One entry of a bloom scope: a styling colour knob, a group of them, or a CSS colour — the last
 * for what the styling module does not paint, such as a route line in its `mainColor`.
 *
 * @group Map Effects
 */
// `string & {}` accepts any CSS colour while leaving the knob names to autocomplete.
export type BloomScopeEntry = StylingColorKnobId | StylingColorKnobGroup | (string & {});

/**
 * The colours bloom may light. Empty — the default — lights the whole frame.
 *
 * @group Map Effects
 */
export type BloomScope = readonly BloomScopeEntry[];

const groupsOf = (id: string): string[] =>
    id
        .split('.')
        .slice(0, -1)
        .map((_, index, parts) => parts.slice(0, index + 1).join('.'));

// Every name a scope accepts besides a CSS colour, and the colour knobs it stands for: each knob
// under its own id, and under every group its id falls in.
const NAMED_KNOBS: ReadonlyMap<string, readonly StylingColorKnobId[]> = (() => {
    const named = new Map<string, StylingColorKnobId[]>();
    for (const id of stylingColorKnobIds) {
        for (const name of [...groupsOf(id), id]) named.set(name, [...(named.get(name) ?? []), id]);
    }
    return named;
})();

/**
 * The names a scope accepts besides CSS colours, in catalogue order: each group before its first knob.
 * @ignore
 */
export const bloomScopeNames: readonly string[] = [...NAMED_KNOBS.keys()];

/**
 * Why an entry is not one a scope can use, or undefined when it is: a known name, or a CSS colour.
 * @ignore
 */
export const invalidScopeEntry = (entry: unknown): string | undefined => {
    if (typeof entry !== 'string') return `${String(entry)} is not a string`;
    if (NAMED_KNOBS.has(entry) || parseCssColor(entry)) return undefined;

    return `'${entry}' is neither a CSS colour nor a styling colour knob or group`;
};

/**
 * Whether resolving a scope needs the styling module — any entry that names knobs rather than
 * giving a colour outright.
 * @ignore
 */
export const scopeReadsStyling = (scope: BloomScope): boolean => scope.some((entry) => NAMED_KNOBS.has(entry));

/**
 * The colours a scope currently wears. Named entries are read from the styling module, so a
 * recolour or a style switch moves the scope with it; a knob the style paints with an expression no
 * single literal stands for yields nothing, and so does a named entry before the module arrives.
 * @ignore
 */
export const scopeColors = (styling: StylingModule | undefined, scope: BloomScope): RGBAColor[] =>
    scope.flatMap((entry) => {
        const knobs = NAMED_KNOBS.get(entry);
        const literals = knobs ? knobs.map((id) => styling?.get(id)) : [entry];
        return literals
            .map((value) => (typeof value === 'string' ? parseCssColor(value) : undefined))
            .filter((color) => color !== undefined);
    });

// The cube is indexed by the top five bits of each channel: 32³ entries covering every colour a
// pixel can be, built once per scope so the per-pixel work is one lookup rather than one distance
// per key colour.
const CUBE_BITS = 3;
const CUBE_SIDE = 256 >> CUBE_BITS;
const cubeIndex = (red: number, green: number, blue: number): number =>
    ((red >> CUBE_BITS) * CUBE_SIDE + (green >> CUBE_BITS)) * CUBE_SIDE + (blue >> CUBE_BITS);

type Chromaticity = [red: number, green: number, blue: number];

/**
 * Chromaticity: the colour with its brightness divided out, so a dim edge and the lit centre of the
 * same tube compare equal — and so do a 0–1 key colour and the 0–255 pixel wearing it. Black has no
 * chromaticity and is returned as such.
 */
const chromaticity = ([red, green, blue]: readonly number[]): Chromaticity | undefined => {
    const top = Math.max(red, green, blue);
    if (top === 0) return undefined;

    return [red / top, green / top, blue / top];
};

/**
 * A lookup cube saying, for every colour, whether bloom may light it: within `tolerance` of some
 * key colour's chromaticity. An empty key set has nothing to key on and returns undefined, which is
 * what lights the whole frame.
 * @ignore
 */
export const buildScopeMask = (colors: RGBAColor[], tolerance: number): Uint8Array | undefined => {
    const keyColors = colors.map(chromaticity).filter((color) => color !== undefined);
    if (keyColors.length === 0) return undefined;

    const limit = tolerance * tolerance;
    const mask = new Uint8Array(CUBE_SIDE * CUBE_SIDE * CUBE_SIDE);
    for (let red = 0; red < 256; red += 1 << CUBE_BITS) {
        for (let green = 0; green < 256; green += 1 << CUBE_BITS) {
            for (let blue = 0; blue < 256; blue += 1 << CUBE_BITS) {
                const pixel = chromaticity([red, green, blue]);
                if (!pixel) continue;

                const lit = keyColors.some((key) => {
                    const deltaRed = pixel[0] - key[0];
                    const deltaGreen = pixel[1] - key[1];
                    const deltaBlue = pixel[2] - key[2];
                    return deltaRed * deltaRed + deltaGreen * deltaGreen + deltaBlue * deltaBlue <= limit;
                });
                if (lit) mask[cubeIndex(red, green, blue)] = 1;
            }
        }
    }
    return mask;
};

/**
 * Blacks out every RGBA pixel the scope does not cover, in place. Black is the identity under
 * `screen`, so a pixel dropped here adds nothing to the frame — the same way a pixel below the
 * threshold contributes nothing.
 * @ignore
 */
export const maskPixels = (pixels: Uint8ClampedArray, mask: Uint8Array): void => {
    for (let index = 0; index < pixels.length; index += 4) {
        if (mask[cubeIndex(pixels[index], pixels[index + 1], pixels[index + 2])]) continue;

        pixels[index] = 0;
        pixels[index + 1] = 0;
        pixels[index + 2] = 0;
    }
};

/**
 * {@link maskPixels} over everything a 2D canvas holds — the one step the live bloom and the
 * capture both take before their threshold runs.
 * @ignore
 */
export const applyScopeMask = (context: CanvasRenderingContext2D, mask: Uint8Array): void => {
    const image = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    maskPixels(image.data, mask);
    context.putImageData(image, 0, 0);
};
