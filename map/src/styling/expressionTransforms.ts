/**
 * Rewrites of MapLibre style values that need no knowledge of the style they run on: they wrap or
 * scale what the style already does, so they survive style-version bumps and work on custom styles.
 *
 * The one rule they all respect: a `["zoom"]` expression may only be the input of a top-level
 * `interpolate`/`step`. A value with `zoom` anywhere else cannot be wrapped in `["*", factor, …]`,
 * so the transform returns `undefined` and the caller keeps the style's own value.
 *
 * @module
 * @ignore
 */

// Scaled sizes land on 1.2000000000000002 as readily as 1.2 in binary floating point; thousandths
// are already finer than a pixel fraction the renderer can draw.
const roundScaled = (value: number): number => Math.round(value * 1000) / 1000;

const mentionsZoom = (value: unknown): boolean => JSON.stringify(value).includes('"zoom"');

/**
 * A pre-expression style function: `{ stops: [[input, output], …] }`, still used by compiled styles
 * for zoom ramps.
 * @ignore
 */
export type LegacyFunction = { stops: [unknown, unknown][]; base?: number; property?: string };

/** @ignore */
export const isLegacyFunction = (value: unknown): value is LegacyFunction =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as LegacyFunction).stops);

/**
 * The style's own numeric value multiplied by `factor`, keeping its shape:
 * - a constant scales directly;
 * - an `interpolate`/`step` keeps its zoom ramp with every stop's output scaled (outputs recurse,
 *   so a `match` inside a stop is wrapped as a whole) — a motorway stays wider than a footpath and
 *   the whole hierarchy thickens in proportion;
 * - a legacy `{ stops: [...] }` function scales its outputs the same way;
 * - any other zoom-free expression is wrapped in a top-level `["*", factor, value]`.
 *
 * Returns `undefined` when the value cannot be scaled (a string, or an expression that still holds
 * `zoom` where a wrapper would be illegal), so the caller can leave the style's value untouched.
 * @ignore
 */
export const scaleNumericValue = (value: unknown, factor: number): unknown => {
    if (typeof value === 'number') return roundScaled(value * factor);

    if (isLegacyFunction(value)) return scaleLegacyStops(value, factor);

    if (!Array.isArray(value)) return undefined;

    if (value[0] === 'interpolate' || value[0] === 'step') return scaleRampOutputs(value, factor);

    return mentionsZoom(value) ? undefined : ['*', factor, value];
};

// A stop whose output cannot be scaled takes the whole ramp with it: a partly scaled ramp would
// break the hierarchy the style draws, so the caller keeps the style's value instead.
const scaleLegacyStops = (value: LegacyFunction, factor: number): unknown => {
    const stops: [unknown, unknown][] = [];
    for (const [input, output] of value.stops) {
        const scaled = scaleNumericValue(output, factor);
        if (scaled === undefined) return undefined;

        stops.push([input, scaled]);
    }
    return { ...value, stops };
};

// Outputs sit every other slot: from index 4 for interpolate
// ([interpolate, curve, input, stop, out, …]), from 2 for step ([step, input, out, stop, out, …]).
const scaleRampOutputs = (value: unknown[], factor: number): unknown => {
    const scaled = [...value];
    for (let index = value[0] === 'interpolate' ? 4 : 2; index < scaled.length; index += 2) {
        const output = scaleNumericValue(scaled[index], factor);
        if (output === undefined) return undefined;

        scaled[index] = output;
    }
    return scaled;
};

/**
 * Shifts the zoom offset the TomTom styles use to stagger feature density: a filter term of the
 * form `["-", ["zoom"], offset]` compared against a feature's `display_class`. Adding to the offset
 * makes features appear later (a sparser map), subtracting makes them appear earlier.
 *
 * Returns the rewritten filter and whether any offset was found; the tree is copied, never mutated.
 * @ignore
 */
export const shiftZoomOffset = (filter: unknown, shift: number): { filter: unknown; patched: boolean } => {
    let patched = false;
    const walk = (node: unknown): unknown => {
        if (!Array.isArray(node)) return node;
        if (
            node[0] === '-' &&
            node.length === 3 &&
            Array.isArray(node[1]) &&
            node[1][0] === 'zoom' &&
            typeof node[2] === 'number'
        ) {
            patched = true;
            return ['-', ['zoom'], node[2] + shift];
        }
        return node.map(walk);
    };
    return { filter: walk(filter), patched };
};
