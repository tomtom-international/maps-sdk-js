import { vi } from 'vitest';

type Handle = { kind: 'texture' | 'framebuffer' | 'shader' | 'program'; id: number };

/** One `drawArrays`: the texture bound to unit 0, and the framebuffer written — `null` for the canvas. */
export type RecordedDraw = { reads: Handle | null; writes: Handle | null; program: Handle | null };

export type FakeWebGL2Options = {
    /** Uniform names the programs do not declare, so their location is `null`. */
    undeclaredUniforms?: readonly string[];
    /** Fragment sources whose compile fails. */
    failingFragments?: readonly string[];
    failLink?: boolean;
    /** How many framebuffers the context hands out before it returns `null`. */
    framebufferBudget?: number;
    /** How many textures the context hands out before it returns `null`. */
    textureBudget?: number;
};

/**
 * A WebGL2 context that keeps just enough state to say which texture each draw read and which
 * framebuffer it wrote, so the substrate's routing is testable where jsdom has no GPU. The constants
 * are their own names, which keeps a recorded call readable.
 */
export const fakeWebGL2 = (options: FakeWebGL2Options = {}) => {
    let nextId = 0;
    const handle = (kind: Handle['kind']): Handle => ({ kind, id: nextId++ });
    const state = {
        texture: null as Handle | null,
        framebuffer: null as Handle | null,
        program: null as Handle | null,
    };
    const shaderSources = new Map<Handle, string>();
    const attachments = new Map<Handle, Handle>();
    const draws: RecordedDraw[] = [];
    let framebufferBudget = options.framebufferBudget ?? Number.POSITIVE_INFINITY;
    let textureBudget = options.textureBudget ?? Number.POSITIVE_INFINITY;

    const constants = Object.fromEntries(
        [
            'TEXTURE_2D',
            'TEXTURE0',
            'TEXTURE_WRAP_S',
            'TEXTURE_WRAP_T',
            'TEXTURE_MAG_FILTER',
            'TEXTURE_MIN_FILTER',
            'CLAMP_TO_EDGE',
            'LINEAR',
            'LINEAR_MIPMAP_LINEAR',
            'RGBA',
            'UNSIGNED_BYTE',
            'FRAMEBUFFER',
            'COLOR_ATTACHMENT0',
            'UNPACK_FLIP_Y_WEBGL',
            'VERTEX_SHADER',
            'FRAGMENT_SHADER',
            'COMPILE_STATUS',
            'LINK_STATUS',
            'TRIANGLES',
        ].map((name) => [name, name]),
    );

    const loseContext = vi.fn();
    const gl = {
        ...constants,
        createTexture: vi.fn(() => (textureBudget-- > 0 ? handle('texture') : null)),
        createFramebuffer: vi.fn(() => (framebufferBudget-- > 0 ? handle('framebuffer') : null)),
        deleteTexture: vi.fn(),
        deleteFramebuffer: vi.fn(),
        bindTexture: vi.fn((_target: string, texture: Handle | null) => {
            state.texture = texture;
        }),
        bindFramebuffer: vi.fn((_target: string, framebuffer: Handle | null) => {
            state.framebuffer = framebuffer;
        }),
        framebufferTexture2D: vi.fn((_target: string, _attachment: string, _textarget: string, texture: Handle) => {
            if (state.framebuffer) attachments.set(state.framebuffer, texture);
        }),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        pixelStorei: vi.fn(),
        generateMipmap: vi.fn(() => state.texture),
        viewport: vi.fn(),
        activeTexture: vi.fn(),
        createShader: vi.fn(() => handle('shader')),
        shaderSource: vi.fn((shader: Handle, source: string) => shaderSources.set(shader, source)),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(
            (shader: Handle) =>
                !options.failingFragments?.some((fragment) => shaderSources.get(shader)?.endsWith(fragment)),
        ),
        getShaderInfoLog: vi.fn(() => 'fake compile error'),
        deleteShader: vi.fn(),
        createProgram: vi.fn(() => handle('program')),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => !options.failLink),
        getProgramInfoLog: vi.fn(() => 'fake link error'),
        useProgram: vi.fn((program: Handle) => {
            state.program = program;
        }),
        getUniformLocation: vi.fn((_program: Handle, name: string) =>
            options.undeclaredUniforms?.includes(name) ? null : name,
        ),
        uniform1i: vi.fn(),
        uniform1f: vi.fn(),
        uniform2f: vi.fn(),
        drawArrays: vi.fn(() => {
            draws.push({ reads: state.texture, writes: state.framebuffer, program: state.program });
        }),
        getExtension: vi.fn((name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null)),
    };

    return {
        gl,
        draws,
        loseContext,
        /** The texture a framebuffer renders into. */
        textureOf: (framebuffer: Handle | null) => (framebuffer ? attachments.get(framebuffer) : undefined),
        /** Mip chains built, by the texture each was built on. */
        mipmapped: () => gl.generateMipmap.mock.results.map((result) => result.value as Handle | null),
    };
};
