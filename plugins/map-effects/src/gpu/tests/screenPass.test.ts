// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { type PassStage, ScreenPassRenderer } from '../screenPass';
import { type FakeWebGL2Options, fakeWebGL2 } from './fakeWebGL2';

const rendererOver = (options?: FakeWebGL2Options) => {
    const fake = fakeWebGL2(options);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
        type === 'webgl2' ? fake.gl : null) as never);
    return { fake, renderer: new ScreenPassRenderer() };
};

const sourceOf = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

const stage = (fragment: string, mipmapped = false): PassStage => ({ fragment, uniforms: {}, mipmapped });

afterEach(() => vi.restoreAllMocks());

describe('ScreenPassRenderer', () => {
    test('without a WebGL2 context, or with nothing to run, it renders nothing', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
        expect(new ScreenPassRenderer().render(sourceOf(40, 20), [stage('a')])).toBeUndefined();

        const { fake, renderer } = rendererOver();
        expect(renderer.render(sourceOf(40, 20), [])).toBeUndefined();
        expect(renderer.render(sourceOf(0, 20), [stage('a')])).toBeUndefined();
        expect(fake.draws).toHaveLength(0);
    });

    test('one stage paints the canvas straight from the source, at its size, with its uniforms', () => {
        const { fake, renderer } = rendererOver({ undeclaredUniforms: ['uUnused'] });
        const rendered = renderer.render(sourceOf(40, 20), [
            { fragment: 'a', uniforms: { uFocus: 0.5, uTexel: [0.025, 0.05], uUnused: 1 } },
        ]);

        expect(rendered).toBe(renderer.canvas);
        expect([renderer.canvas.width, renderer.canvas.height]).toEqual([40, 20]);
        expect(fake.draws).toEqual([
            { reads: expect.objectContaining({ kind: 'texture' }), writes: null, program: expect.anything() },
        ]);
        expect(fake.gl.createFramebuffer).not.toHaveBeenCalled();
        expect(fake.gl.pixelStorei).toHaveBeenCalledWith('UNPACK_FLIP_Y_WEBGL', true);
        expect(fake.gl.uniform1i).toHaveBeenCalledWith('uSource', 0);
        expect(fake.gl.uniform1f).toHaveBeenCalledWith('uFocus', 0.5);
        expect(fake.gl.uniform2f).toHaveBeenCalledWith('uTexel', 0.025, 0.05);
        expect(fake.gl.uniform1f).toHaveBeenCalledTimes(1);
    });

    test('a chain ping-pongs: each pass reads what the one before wrote, and only the last paints the canvas', () => {
        const { fake, renderer } = rendererOver();
        renderer.render(sourceOf(40, 20), [stage('a'), stage('b'), stage('c')]);

        const [first, second, third] = fake.draws;
        expect(first.writes).not.toBeNull();
        expect(second.writes).not.toBeNull();
        expect(second.writes).not.toBe(first.writes);
        expect(second.reads).toBe(fake.textureOf(first.writes));
        expect(third.reads).toBe(fake.textureOf(second.writes));
        expect(third.writes).toBeNull();
        expect(new Set(fake.draws.map((draw) => draw.program)).size).toBe(3);
    });

    test('mips are built on what a mipmapped stage reads: the source when it leads, a target otherwise', () => {
        const leading = rendererOver();
        leading.renderer.render(sourceOf(40, 20), [stage('lens', true)]);
        expect(leading.fake.mipmapped()).toEqual([leading.fake.draws[0].reads]);

        const following = rendererOver();
        following.renderer.render(sourceOf(40, 20), [stage('a'), stage('lens', true)]);
        expect(following.fake.mipmapped()).toEqual([following.fake.textureOf(following.fake.draws[0].writes)]);
    });

    test('targets and programs are kept across frames, and targets are rebuilt when the size changes', () => {
        const { fake, renderer } = rendererOver();
        const chain = [stage('a'), stage('b')];
        renderer.render(sourceOf(40, 20), chain);
        renderer.render(sourceOf(40, 20), chain);
        expect(fake.gl.createFramebuffer).toHaveBeenCalledTimes(2);
        expect(fake.gl.createProgram).toHaveBeenCalledTimes(2);

        renderer.render(sourceOf(80, 40), chain);
        expect(fake.gl.deleteFramebuffer).toHaveBeenCalledTimes(2);
        expect(fake.gl.createFramebuffer).toHaveBeenCalledTimes(4);
        expect(fake.gl.createProgram).toHaveBeenCalledTimes(2);
    });

    test('a context that will not give it a texture or a target renders nothing rather than a wrong picture', () => {
        const noTexture = rendererOver({ textureBudget: 0 });
        expect(noTexture.renderer.render(sourceOf(40, 20), [stage('a')])).toBeUndefined();

        const noTarget = rendererOver({ framebufferBudget: 1 });
        expect(noTarget.renderer.render(sourceOf(40, 20), [stage('a'), stage('b')])).toBeUndefined();
        expect(noTarget.fake.draws).toHaveLength(0);
    });

    test('a shader that fails to compile or link is skipped, with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const compiling = rendererOver({ failingFragments: ['broken'] });
        compiling.renderer.render(sourceOf(40, 20), [stage('broken')]);
        expect(compiling.fake.draws).toHaveLength(0);
        expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('failed to compile: fake compile error'));

        const linking = rendererOver({ failLink: true });
        linking.renderer.render(sourceOf(40, 20), [stage('a')]);
        expect(linking.fake.draws).toHaveLength(0);
        expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('failed to link: fake link error'));
    });

    test('a lost context renders nothing until it is restored, and then rebuilds everything it held', () => {
        const { fake, renderer } = rendererOver();
        const chain = [stage('a'), stage('b')];
        renderer.render(sourceOf(40, 20), chain);

        const lost = new Event('webglcontextlost', { cancelable: true });
        renderer.canvas.dispatchEvent(lost);
        expect(lost.defaultPrevented).toBe(true);
        expect(renderer.render(sourceOf(40, 20), chain)).toBeUndefined();

        renderer.canvas.dispatchEvent(new Event('webglcontextrestored'));
        expect(renderer.render(sourceOf(40, 20), chain)).toBe(renderer.canvas);
        expect(fake.gl.createProgram).toHaveBeenCalledTimes(4);
        expect(fake.gl.createFramebuffer).toHaveBeenCalledTimes(4);
        expect(fake.gl.createTexture).toHaveBeenCalledTimes(6);
    });

    test('remove loses the context, which is what gives it back to the page', () => {
        const { fake, renderer } = rendererOver();
        renderer.remove();
        expect(fake.loseContext).toHaveBeenCalledTimes(1);
    });
});
