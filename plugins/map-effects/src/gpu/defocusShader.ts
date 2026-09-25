/**
 * The depth-of-field pass' contract with the substrate: the program, and the uniform names the
 * stage binds into it.
 *
 * The optics are worked out in `effectFilters.ts` and arrive here as uniforms; the program itself
 * is `glsl/defocus.frag.glsl`, a real GLSL file loaded with Vite's `?raw` rather than a template
 * literal — which is what keeps a backtick inside a shader comment a character rather than the end
 * of the program.
 *
 * @module
 * @ignore
 */

import defocusFragment from './glsl/defocus.frag.glsl?raw';

/** The uniform names the program declares, so the stage and the tests agree on one spelling. */
export type DefocusUniforms = {
    /** How much nearer the bottom of the frame is than the top, in normalised reciprocal distance. */
    uDepth: number;
    /** The plane of focus, on that same scale. */
    uFocus: number;
    /** How much of the scale either side of it stays sharp. */
    uBand: number;
    /** The widest circle of confusion, in device pixels — a diameter, as a lens' is. */
    uBlur: number;
    /** How far a bright sample may outweigh a dull one: the difference between a defocus and a bokeh. */
    uBokeh: number;
    /** 1 / the resolution being rendered, so an offset in device pixels is a UV step. */
    uTexel: readonly [number, number];
};

export const DEFOCUS_SHADER: string = defocusFragment;
