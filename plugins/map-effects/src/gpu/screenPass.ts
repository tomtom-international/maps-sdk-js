/**
 * The WebGL2 substrate the pixel-derived effects run on: one context, one full-screen triangle, and
 * a pair of render targets a chain of passes ping-pongs between. No effect lives here — a pass
 * brings its own fragment shader and its own uniforms, and this module is what stops two of them
 * being two implementations of context creation, texture upload, resizing and context loss.
 *
 * **One context for the plugin, and that is a requirement rather than a saving.** A browser caps
 * how many live WebGL contexts a page may hold, and the map itself already holds one.
 *
 * The two shaders it owns — the triangle's vertex half and the preamble every fragment stage is
 * composed onto — are real GLSL files under `glsl/`, loaded with Vite's `?raw`, as every shader in
 * this plugin is: a backtick inside a template literal's comment closes the literal, and the
 * program it silently truncates still compiles to a blank picture.
 *
 * @module
 * @ignore
 */

import FRAGMENT_PREAMBLE from './glsl/fragmentPreamble.glsl?raw';
import VERTEX_SHADER from './glsl/screenPass.vert.glsl?raw';

/**
 * One link of the chain: a fragment shader, the uniforms it reads, and whether it samples levels
 * other than 0 — which is what makes the source worth a mip chain.
 * @ignore
 */
export type PassStage = {
    fragment: string;
    uniforms: Record<string, number | readonly [number, number]>;
    mipmapped?: boolean;
};

type RenderTarget = { texture: WebGLTexture; framebuffer: WebGLFramebuffer };

// How every texture in the chain is sampled at level 0: clamped, so a tap that runs off the edge of
// a disc reads the edge rather than wrapping, and linear, so it reads between texels.
const clampAndFilter = (gl: WebGL2RenderingContext): void => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
};

/**
 * Sizes a canvas that is drawn every frame. Assigning either dimension clears the canvas and
 * reallocates its bitmap even when the value is unchanged, so this only assigns when the size moved.
 * @ignore
 */
export const resizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number): void => {
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | undefined => {
    const shader = gl.createShader(type);
    if (!shader) return undefined;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

    console.warn(`[MapEffects] shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return undefined;
};

/**
 * Renders a chain of full-screen passes over a source canvas, onto a canvas of its own.
 * @ignore
 */
export class ScreenPassRenderer {
    /** The canvas the chain draws into — the one a caller shows, or reads back. */
    readonly canvas: HTMLCanvasElement;
    private readonly gl: WebGL2RenderingContext | undefined;
    private readonly programs = new Map<string, WebGLProgram>();
    private sourceTexture: WebGLTexture | undefined;
    private targets: RenderTarget[] = [];
    private targetSize = { width: 0, height: 0 };
    private lost = false;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.addEventListener('webglcontextlost', (event) => {
            // Without this the context never comes back, and nor does the picture.
            event.preventDefault();
            this.lost = true;
        });
        this.canvas.addEventListener('webglcontextrestored', () => {
            this.programs.clear();
            this.sourceTexture = undefined;
            this.targets = [];
            this.targetSize = { width: 0, height: 0 };
            this.lost = false;
        });
        this.gl =
            this.canvas.getContext('webgl2', {
                alpha: true,
                antialias: false,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
            }) ?? undefined;
    }

    /**
     * Runs `stages` over `source`, in order, and returns the canvas holding the result — or
     * `undefined` when there is nothing to run or no context to run it on.
     */
    render(source: HTMLCanvasElement, stages: PassStage[]): HTMLCanvasElement | undefined {
        const gl = this.gl;
        if (!gl || this.lost || !stages.length || !source.width || !source.height) return undefined;

        resizeCanvas(this.canvas, source.width, source.height);
        let input = this.uploadSource(source, stages[0].mipmapped);
        // Without somewhere to put a pass' result, a chain would run every stage over the source
        // and show only the last — a wrong picture, where no picture at least says so.
        if (!input || (stages.length > 1 && !this.holdTargets(gl))) return undefined;

        for (let index = 0; index < stages.length; index++) {
            // The last pass paints the canvas the caller shows; the ones before it paint a target
            // the next pass reads, so the picture never leaves the GPU between them.
            const target = index === stages.length - 1 ? undefined : this.targets[index % this.targets.length];
            this.runStage(gl, stages[index], input, target);
            if (!target) continue;

            input = target.texture;
            if (stages[index + 1].mipmapped) this.mipmap(gl, input);
        }
        return this.canvas;
    }

    /** Releases the context's resources; the canvas is the caller's to remove. */
    remove(): void {
        this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }

    /**
     * The pair of targets the chain ping-pongs between, at the current size — kept rather than
     * made per frame, since a chain runs on every map frame and a texture allocation does not
     * belong there. `false` when the context would not give us one.
     */
    private holdTargets(gl: WebGL2RenderingContext): boolean {
        const { width, height } = this.canvas;
        if (this.targets.length === 2 && this.targetSize.width === width && this.targetSize.height === height) {
            return true;
        }

        this.releaseTargets(gl);
        while (this.targets.length < 2) {
            const texture = gl.createTexture();
            const framebuffer = gl.createFramebuffer();
            if (!texture || !framebuffer) return false;

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            clampAndFilter(gl);
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            this.targets.push({ texture, framebuffer });
        }
        this.targetSize = { width, height };
        return true;
    }

    private releaseTargets(gl: WebGL2RenderingContext): void {
        for (const { texture, framebuffer } of this.targets) {
            gl.deleteTexture(texture);
            gl.deleteFramebuffer(framebuffer);
        }
        this.targets = [];
    }

    // A gather reads the level whose texels are as wide as the gaps between its taps, so a stage
    // that samples levels needs them built on whatever it is about to read — target or source.
    private mipmap(gl: WebGL2RenderingContext, texture: WebGLTexture): void {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    // The map's pixels as a texture, or `undefined` where the context would not give us one.
    private uploadSource(source: HTMLCanvasElement, mipmapped = false): WebGLTexture | undefined {
        const gl = this.gl;
        if (!gl) return undefined;

        this.sourceTexture ??= gl.createTexture() ?? undefined;
        if (!this.sourceTexture) return undefined;

        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        clampAndFilter(gl);
        if (mipmapped) this.mipmap(gl, this.sourceTexture);
        return this.sourceTexture;
    }

    private runStage(
        gl: WebGL2RenderingContext,
        stage: PassStage,
        input: WebGLTexture,
        target: RenderTarget | undefined,
    ): void {
        const program = this.programOf(gl, stage.fragment);
        if (!program) return;

        gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, input);
        gl.uniform1i(gl.getUniformLocation(program, 'uSource'), 0);
        for (const [name, value] of Object.entries(stage.uniforms)) {
            const location = gl.getUniformLocation(program, name);
            if (!location) continue;

            if (typeof value === 'number') {
                gl.uniform1f(location, value);
            } else {
                gl.uniform2f(location, value[0], value[1]);
            }
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    private programOf(gl: WebGL2RenderingContext, fragment: string): WebGLProgram | undefined {
        const cached = this.programs.get(fragment);
        if (cached) return cached;

        const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, `${FRAGMENT_PREAMBLE}${fragment}`);
        const program = vertexShader && fragmentShader ? gl.createProgram() : undefined;
        if (!program || !vertexShader || !fragmentShader) return undefined;

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn(`[MapEffects] shader failed to link: ${gl.getProgramInfoLog(program)}`);
            return undefined;
        }

        this.programs.set(fragment, program);
        return program;
    }
}
