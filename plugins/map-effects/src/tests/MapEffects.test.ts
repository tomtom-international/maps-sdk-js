// @vitest-environment jsdom
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { describe, expect, test, vi } from 'vitest';
import { MapEffects } from '../MapEffects';

// A map whose container has MapLibre's canvas container, and a canvas that reports a preserved buffer.
const makeMap = () => {
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
    // jsdom has no WebGL: report a preserved buffer so the warning path stays quiet here.
    canvas.getContext = vi.fn(() => ({ getContextAttributes: () => ({ preserveDrawingBuffer: true }) })) as never;

    const listeners: Record<string, Array<() => void>> = {};
    const mapLibreMap = {
        getContainer: () => container,
        getCanvas: () => canvas,
        on: vi.fn((event: string, listener: () => void) => {
            const forEvent = listeners[event] ?? [];
            forEvent.push(listener);
            listeners[event] = forEvent;
        }),
        off: vi.fn(),
        once: vi.fn(),
        triggerRepaint: vi.fn(),
        getPixelRatio: () => 1,
        setPixelRatio: vi.fn(),
    };
    return { map: { mapLibreMap, styleLightDarkTheme: 'light' } as unknown as TomTomMap, container, listeners };
};

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

    test('validates before touching anything', () => {
        const { map } = makeMap();
        const effects = new MapEffects(map);
        expect(() => effects.set({ 'bloom.intensity': 2 })).toThrow(RangeError);
        expect(() => effects.set({ 'tint.color': 3 as never })).toThrow(RangeError);
        expect(() => effects.set({ 'glitter.amount': 1 } as never)).toThrow(/Unknown effect knob/);
        expect(effects.getConfig()).toEqual({});
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
