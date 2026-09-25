// @vitest-environment jsdom
import { StylingModule, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeWebGL2 } from '../gpu/tests/fakeWebGL2';
import { MapEffects } from '../MapEffects';
import { stylingWith } from './fakeStyling';

type Pixel = [red: number, green: number, blue: number];

// A map whose container has MapLibre's canvas container, and a canvas that reports a preserved
// buffer. Tilted by default, since the depth of field is a function of the camera.
const makeMap = ({ pitch = 60, pixelRatio = 1, preserveDrawingBuffer = true } = {}) => {
    const container = document.createElement('div');
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'maplibregl-canvas-container';
    const canvas = document.createElement('canvas');
    canvasContainer.appendChild(canvas);
    container.appendChild(canvasContainer);
    const controls = document.createElement('div');
    controls.className = 'maplibregl-control-container';
    container.appendChild(controls);
    document.body.appendChild(container);
    // jsdom has no WebGL, so the map canvas reports its context attributes itself.
    canvas.getContext = vi.fn(() => ({ getContextAttributes: () => ({ preserveDrawingBuffer }) })) as never;

    const listeners: Record<string, Array<() => void>> = {};
    const onceListeners: Record<string, () => void> = {};
    const mapLibreMap = {
        getContainer: () => container,
        getCanvas: () => canvas,
        on: vi.fn((event: string, listener: () => void) => {
            const forEvent = listeners[event] ?? [];
            forEvent.push(listener);
            listeners[event] = forEvent;
        }),
        off: vi.fn(),
        once: vi.fn((event: string, listener: () => void) => {
            onceListeners[event] = listener;
        }),
        triggerRepaint: vi.fn(),
        getPixelRatio: () => pixelRatio,
        setPixelRatio: vi.fn(),
        getPitch: () => pitch,
        getVerticalFieldOfView: () => 36.87,
    };
    return {
        map: { mapLibreMap, styleLightDarkTheme: 'light' } as unknown as TomTomMap,
        container,
        listeners,
        onceListeners,
    };
};

const opaque = (pixels: Pixel[]) => new Uint8ClampedArray(pixels.flatMap((pixel) => [...pixel, 255]));

// A GPU for the chain's own canvas, and a 2D context for bloom and capture — both of which jsdom
// lacks. Every 2D canvas reads back as one row of `pixels`. The map canvas keeps its own stub from `makeMap`.
const withContexts = (pixels: Pixel[] = []) => {
    const gpu = fakeWebGL2();
    const context2d = {
        drawImage: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        filter: '',
        canvas: { width: pixels.length, height: 1 },
        getImageData: vi.fn(() => ({ data: opaque(pixels) })),
        putImageData: vi.fn<(image: { data: Uint8ClampedArray }) => void>(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
        type === 'webgl2' ? gpu.gl : type === '2d' ? context2d : null) as never);
    return { gpu, context2d };
};

const artworkOf = (container: HTMLElement) => container.querySelector('[data-effect="artwork"]') as HTMLCanvasElement;

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('MapEffects', () => {
    test('mounts its overlays after the canvas container and below the controls, all hidden', () => {
        const { map, container } = makeMap();
        const effects = new MapEffects(map);
        expect(effects.getConfig()).toEqual({});

        const root = container.querySelector('.tomtom-map-effects') as HTMLElement;
        expect(root.previousElementSibling?.className).toBe('maplibregl-canvas-container');
        expect(root.nextElementSibling?.className).toBe('maplibregl-control-container');
        expect(root.style.pointerEvents).toBe('none');
        for (const overlay of Array.from(root.children) as HTMLElement[]) {
            expect(overlay.style.display).toBe('none');
        }
    });

    test('set turns the matching overlay on with the filter maths; reset turns it off', () => {
        const { map, container } = makeMap();
        const effects = new MapEffects(map);
        effects.set({
            'grade.saturation': 0.4,
            'tint.opacity': 0.2,
            'tint.color': '#ff0000',
            'vignette.intensity': -0.5,
        });

        const overlay = (name: string) => container.querySelector(`[data-effect="${name}"]`) as HTMLElement;
        expect(overlay('grade').style.display).toBe('block');
        expect(overlay('grade').style.backdropFilter).toBe('saturate(0.4)');
        expect(overlay('tint').style.opacity).toBe('0.2');
        expect(overlay('tint').style.backgroundColor).toBe('rgb(255, 0, 0)');
        expect(overlay('vignette').style.backgroundImage).toContain('radial-gradient');
        expect(overlay('bloom').style.display).toBe('none');

        effects.reset('tint.opacity');
        expect(overlay('tint').style.display).toBe('none');
        expect(effects.getConfig()).toEqual({
            'grade.saturation': 0.4,
            'tint.color': '#ff0000',
            'vignette.intensity': -0.5,
        });

        effects.reset();
        expect(overlay('grade').style.display).toBe('none');
        expect(effects.getConfig()).toEqual({});
    });

    test('the GPU chain sits under every overlay, since it replaces the picture they filter', () => {
        const { map, container } = makeMap();
        new MapEffects(map);

        const root = container.querySelector('.tomtom-map-effects') as HTMLElement;
        expect((root.firstElementChild as HTMLElement).dataset.effect).toBe('artwork');
        // Off until a pass has something to run, and jsdom hands out no WebGL2 context at all —
        // which is also the browser that cannot run it, and must still show the map.
        expect((root.firstElementChild as HTMLElement).style.display).toBe('none');
    });

    test('the depth of field is a chain pass rather than an overlay', () => {
        const { map, container } = makeMap();
        const effects = new MapEffects(map);
        effects.set({ 'depthOfField.intensity': 8, 'depthOfField.focus': 0.5, 'depthOfField.band': 0.4 });

        expect(container.querySelector('[data-effect="depthOfField"]')).toBeNull();
        expect(effects.getConfig()['depthOfField.intensity']).toBe(8);
    });

    test('on a tilted map the lens draws into the artwork canvas, and a flat map hides it', () => {
        const { gpu } = withContexts();
        const tilted = makeMap();
        new MapEffects(tilted.map, { 'depthOfField.intensity': 8 });
        expect(artworkOf(tilted.container).style.display).toBe('block');
        expect(gpu.draws).toHaveLength(1);

        const flat = makeMap({ pitch: 0 });
        new MapEffects(flat.map, { 'depthOfField.intensity': 8 });
        expect(artworkOf(flat.container).style.display).toBe('none');
        expect(gpu.draws).toHaveLength(1);
    });

    test('map renders redraw the lens and the bloom once per frame, bloom reading the lens, until removed', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const { gpu, context2d } = withContexts();
        const { map, container, listeners } = makeMap();
        const effects = new MapEffects(map, { 'depthOfField.intensity': 8, 'bloom.intensity': 0.5 });
        const drawnBySet = gpu.draws.length;

        for (let i = 0; i < 3; i++) listeners.render[0]();
        expect(gpu.draws).toHaveLength(drawnBySet);

        vi.advanceTimersToNextFrame();
        expect(gpu.draws).toHaveLength(drawnBySet + 1);
        expect(context2d.drawImage).toHaveBeenCalledTimes(1);
        expect(context2d.drawImage.mock.calls[0][0]).toBe(artworkOf(container));

        listeners.render[0]();
        effects.remove();
        vi.advanceTimersToNextFrame();
        expect(gpu.draws).toHaveLength(drawnBySet + 1);
        expect(context2d.drawImage).toHaveBeenCalledTimes(1);
        expect(gpu.loseContext).toHaveBeenCalledTimes(1);
    });

    test('capture re-runs the lens over the frame it reads back', async () => {
        const { gpu, context2d } = withContexts();
        const { map, container, onceListeners } = makeMap();
        const effects = new MapEffects(map, { 'depthOfField.intensity': 8 });

        const capturing = effects.capture();
        expect(map.mapLibreMap.triggerRepaint).toHaveBeenCalled();
        onceListeners.render();
        const captured = await capturing;

        expect(gpu.draws).toHaveLength(2);
        expect(context2d.drawImage).toHaveBeenCalledWith(artworkOf(container), 0, 0);
        const source = map.mapLibreMap.getCanvas();
        expect([captured.width, captured.height]).toEqual([source.width, source.height]);
    });

    // `null` is MapLibre's "follow the device"; restoring a number would pin the ratio for good.
    test.each([
        { live: 1, restored: null },
        { live: 2, restored: 2 },
    ])('capture at another ratio renders once the map is idle, then restores $restored', async ({ live, restored }) => {
        withContexts();
        const { map, onceListeners } = makeMap({ pixelRatio: live });
        const capturing = new MapEffects(map).capture({ pixelRatio: 3 });

        expect(map.mapLibreMap.setPixelRatio).toHaveBeenLastCalledWith(3);
        expect(map.mapLibreMap.triggerRepaint).not.toHaveBeenCalled();

        onceListeners.idle();
        await vi.waitFor(() => expect(map.mapLibreMap.triggerRepaint).toHaveBeenCalled());
        onceListeners.render();
        await capturing;
        expect(map.mapLibreMap.setPixelRatio).toHaveBeenLastCalledWith(restored);
    });

    test('a capture whose re-render never goes idle still reads back after the timeout', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        withContexts();
        const { map, onceListeners } = makeMap();
        const capturing = new MapEffects(map).capture({ pixelRatio: 2 });

        await vi.advanceTimersByTimeAsync(15_000);
        expect(map.mapLibreMap.triggerRepaint).toHaveBeenCalled();
        onceListeners.render();
        await expect(capturing).resolves.toBeInstanceOf(HTMLCanvasElement);
    });

    test('warns once, and only once something reads a canvas that does not preserve its buffer', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const { map } = makeMap({ preserveDrawingBuffer: false });
        const effects = new MapEffects(map, { 'grade.saturation': 0.4 });
        expect(warn).not.toHaveBeenCalled();

        effects.set({ 'bloom.intensity': 0.5 });
        effects.set({ 'depthOfField.intensity': 8 });
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toMatch(/preserveDrawingBuffer/);
    });

    test('applyConfig replaces every knob rather than merging into them', () => {
        const { map, container } = makeMap();
        const effects = new MapEffects(map, { 'grade.saturation': 0.4, 'tint.opacity': 0.2 });

        effects.applyConfig({ 'vignette.intensity': -0.5 });
        expect(effects.getConfig()).toEqual({ 'vignette.intensity': -0.5 });
        expect((container.querySelector('[data-effect="tint"]') as HTMLElement).style.display).toBe('none');
    });

    test('validates before touching anything', () => {
        const { map } = makeMap();
        const effects = new MapEffects(map);
        expect(() => effects.set({ 'bloom.intensity': 2 })).toThrow(RangeError);
        expect(() => effects.set({ 'bloom.radius': '12' as never })).toThrow(/expects a number/);
        expect(() => effects.set({ 'tint.color': 3 as never })).toThrow(RangeError);
        expect(() => effects.set({ 'bloom.only': 'traffic' as never })).toThrow(RangeError);
        expect(() => effects.set({ 'bloom.only': ['traffic', 'places'] })).toThrow(/'places' is neither/);
        expect(() => effects.set({ 'bloom.only': ['#zz0000'] })).toThrow(RangeError);
        expect(() => effects.set({ 'glitter.amount': 1 } as never)).toThrow(/Unknown effect knob/);
        expect(effects.getConfig()).toEqual({});

        effects.set({ 'bloom.only': ['traffic.incidents', 'colors.roadMajor', 'hsl(210, 100%, 45%)'] });
        expect(effects.get('bloom.only')).toEqual(['traffic.incidents', 'colors.roadMajor', 'hsl(210, 100%, 45%)']);
    });

    test('describe returns the catalogue in the styling-module shape, with the use case', () => {
        const { map } = makeMap();
        const effects = new MapEffects(map, { 'bloom.intensity': 0.5 });
        const { knobs } = effects.describe();
        const bloom = knobs.find((knob) => knob.id === 'bloom.intensity');
        expect(bloom).toMatchObject({
            kind: 'number',
            default: 0,
            current: 0.5,
            overridden: true,
            range: { min: 0, max: 1, step: 0.05 },
            appliesTo: 'any-style',
            available: true,
        });
        expect(bloom?.useCase).toMatch(/emphasis/i);
        expect(knobs.every((knob) => knob.description.length > 0)).toBe(true);
    });

    test('bloom listens to map renders and stops on remove', () => {
        const { map, container, listeners } = makeMap();
        const effects = new MapEffects(map);
        expect(listeners.render).toHaveLength(1);

        effects.remove();
        expect(map.mapLibreMap.off).toHaveBeenCalledWith('render', listeners.render[0]);
        expect(container.querySelector('.tomtom-map-effects')).toBeNull();
    });
});

describe('bloom.only', () => {
    const green: Pixel = [0, 200, 0];
    const red: Pixel = [200, 0, 0];
    const grey: Pixel = [128, 128, 128];
    const black: Pixel = [0, 0, 0];

    const lastMasked = (context2d: ReturnType<typeof withContexts>['context2d']) =>
        context2d.putImageData.mock.lastCall?.[0].data;

    test('the glow reads the frame with every pixel outside a CSS-colour scope blacked out', () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const getStyling = vi.spyOn(StylingModule, 'get').mockResolvedValue(stylingWith({}));
        const { context2d } = withContexts([green, grey]);
        const { map } = makeMap();
        new MapEffects(map, { 'bloom.intensity': 0.5, 'bloom.only': ['#00c800'] });

        vi.advanceTimersToNextFrame();
        expect(lastMasked(context2d)).toEqual(opaque([green, black]));
        expect(context2d.drawImage.mock.lastCall?.[0]).not.toBe(map.mapLibreMap.getCanvas());
        expect(getStyling).not.toHaveBeenCalled();
    });

    test('a named scope keys on the loaded style once the styling module arrives, and follows a recolour', async () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const colors = { 'traffic.incidents.majorColor': '#00c800' };
        const getStyling = vi.spyOn(StylingModule, 'get').mockResolvedValue(stylingWith(colors));
        const { context2d } = withContexts([green, red]);
        const { map, listeners } = makeMap();
        new MapEffects(map, { 'bloom.intensity': 0.5, 'bloom.only': ['traffic.incidents.majorColor'] });

        vi.advanceTimersToNextFrame();
        expect(context2d.putImageData).not.toHaveBeenCalled();

        // The arrival schedules the redraw itself, since an idle map fires no `render`.
        await getStyling.mock.results[0].value;
        vi.advanceTimersToNextFrame();
        expect(lastMasked(context2d)).toEqual(opaque([green, black]));

        colors['traffic.incidents.majorColor'] = '#c80000';
        for (const listener of listeners.styledata) listener();
        vi.advanceTimersToNextFrame();
        expect(lastMasked(context2d)).toEqual(opaque([black, red]));
        expect(getStyling).toHaveBeenCalledTimes(1);
    });

    test('warns once when a named scope finds no colour in the style, never while the module is on its way', async () => {
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const getStyling = vi.spyOn(StylingModule, 'get').mockResolvedValue(stylingWith({}));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        withContexts([green]);
        const { map } = makeMap();
        const effects = new MapEffects(map, { 'bloom.intensity': 0.5, 'bloom.only': ['traffic'] });

        vi.advanceTimersToNextFrame();
        expect(warn).not.toHaveBeenCalled();

        await getStyling.mock.results[0].value;
        vi.advanceTimersToNextFrame();
        effects.set({ 'bloom.onlyTolerance': 0.3 });
        vi.advanceTimersToNextFrame();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toMatch(/'bloom.only: traffic' found no colour/);
    });

    test('capture keys its glow on the same scope as the live bloom', async () => {
        // Frames are never advanced, so the only mask written is the capture's.
        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
        const { context2d } = withContexts([green, grey]);
        const { map, onceListeners } = makeMap();
        const effects = new MapEffects(map, { 'bloom.intensity': 0.5, 'bloom.only': ['#00c800'] });

        const capturing = effects.capture();
        onceListeners.render();
        await capturing;
        expect(lastMasked(context2d)).toEqual(opaque([green, black]));
    });
});
