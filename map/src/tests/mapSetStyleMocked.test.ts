import { type Language, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest';
import { type StyleChangeContext, TomTomMap } from '../TomTomMap';

// A MapLibre map whose `style.load` and `error` we fire by hand, so a test controls exactly when
// the new style "arrives" (or fails to) relative to the handlers.
type MapMockListener = (event?: unknown) => void;

vi.mock('maplibre-gl', () => {
    class MapMock {
        styleLoadListeners: MapMockListener[] = [];
        errorListeners: MapMockListener[] = [];
        styleLayers: unknown[] = [];
        getStyle = vi.fn(() => ({ layers: this.styleLayers }));
        once = vi.fn((event: string, listener: MapMockListener) => {
            if (event === 'style.load') this.styleLoadListeners.push(listener);
        });
        on = vi.fn((event: string, listener: MapMockListener) => {
            if (event === 'error') this.errorListeners.push(listener);
        });
        off = vi.fn((event: string, listener: MapMockListener) => {
            const listeners = event === 'error' ? this.errorListeners : this.styleLoadListeners;
            const index = listeners.indexOf(listener);
            if (index !== -1) listeners.splice(index, 1);
        });
        getCanvas = vi.fn().mockReturnValue({ style: { cursor: '' } });
        getZoom = vi.fn();
        setStyle = vi.fn();
        setLayoutProperty = vi.fn();
        getSprite = vi.fn().mockReturnValue([]);
        addSprite = vi.fn();
        setTransformRequest = vi.fn();

        fireStyleLoad() {
            const listeners = this.styleLoadListeners;
            this.styleLoadListeners = [];
            for (const listener of listeners) listener();
        }

        fireError(event: unknown) {
            // A copy: the listener under test unsubscribes itself while handling the error.
            for (const listener of this.errorListeners.slice()) listener(event);
        }
    }
    return {
        // biome-ignore lint/complexity/useArrowFunction: arrow functions cannot be invoked with `new`
        Map: vi.fn().mockImplementation(function () {
            return new MapMock();
        }),
        setRTLTextPlugin: vi.fn().mockResolvedValue(vi.fn()),
        getRTLTextPluginStatus: vi.fn(),
        setWorkerCount: vi.fn(),
        getVersion: vi.fn().mockReturnValue('6.0.0'),
    };
});

type MockedMapLibre = Omit<TomTomMap['mapLibreMap'], 'setStyle' | 'setLayoutProperty'> & {
    fireStyleLoad: () => void;
    fireError: (event: unknown) => void;
    styleLayers: unknown[];
    setStyle: Mock;
    setLayoutProperty: Mock;
};

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('TomTomMap.setStyle', () => {
    const mockedContainer = vi.fn() as unknown as HTMLElement;

    beforeEach(() => {
        TomTomConfig.instance.reset();
        TomTomConfig.instance.put({ apiKey: 'TEST_KEY' });
    });

    const newMap = (language?: Language) => {
        const tomtomMap = new TomTomMap({ mapLibre: { container: mockedContainer }, ...(language && { language }) });
        const mapLibre = tomtomMap.mapLibreMap as unknown as MockedMapLibre;
        // Finish the initial load so the map starts ready, like a real one after `style.load`.
        mapLibre.fireStyleLoad();
        return { tomtomMap, mapLibre };
    };

    // A base-map layer whose labels the SDK localises, so a re-applied language is observable.
    const localizableLayer = { id: 'city-labels', type: 'symbol', layout: { 'text-field': '{name}' } };

    const textFieldCalls = (mapLibre: MockedMapLibre) =>
        mapLibre.setLayoutProperty.mock.calls.filter((call: unknown[]) => call[1] === 'text-field');

    test('resetState defaults to false and reaches the handlers', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const contexts: StyleChangeContext[] = [];
        tomtomMap.addStyleChangeHandler({
            onStyleChanged: (context) => {
                contexts.push(context);
            },
        });

        const done = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(contexts).toStrictEqual([{ resetState: false }]);
        expect(tomtomMap.mapReady).toBe(true);
    });

    test('resetState: true is honoured and the language survives it', async () => {
        const { tomtomMap, mapLibre } = newMap('fr-FR');
        mapLibre.styleLayers = [localizableLayer];
        const aboutToChange = vi.fn();
        const changed = vi.fn();
        tomtomMap.addStyleChangeHandler({ onStyleAboutToChange: aboutToChange, onStyleChanged: changed });
        mapLibre.setLayoutProperty.mockClear();

        const done = tomtomMap.setStyle('standardDark', { resetState: true });
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(aboutToChange).toHaveBeenCalledWith({ resetState: true });
        expect(changed).toHaveBeenCalledWith({ resetState: true });
        // The language is configuration, not state: a new style resets every 'text-field', so the
        // clean switch has to write it back.
        expect(textFieldCalls(mapLibre)).toStrictEqual([
            ['city-labels', 'text-field', ['coalesce', ['get', 'name_fr'], ['get', 'name']], { validate: false }],
        ]);
    });

    test('a style switch after a clean one still localises: the clean switch kept the language', async () => {
        const { tomtomMap, mapLibre } = newMap('fr-FR');
        mapLibre.styleLayers = [localizableLayer];

        let done = tomtomMap.setStyle('standardDark', { resetState: true });
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        mapLibre.setLayoutProperty.mockClear();
        done = tomtomMap.setStyle('standardLight');
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(textFieldCalls(mapLibre)).toStrictEqual([
            ['city-labels', 'text-field', ['coalesce', ['get', 'name_fr'], ['get', 'name']], { validate: false }],
        ]);
    });

    test('resetState: true does not merge the previous style parts into the new style', async () => {
        const { tomtomMap, mapLibre } = newMap();
        let done = tomtomMap.setStyle({ type: 'standard', id: 'standardLight', include: ['hillshade'] });
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        done = tomtomMap.setStyle('standardDark', { resetState: true });
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(tomtomMap.getStyle()).toBe('standardDark');
        const styleUrl = mapLibre.setStyle.mock.lastCall?.[0] as string;
        expect(styleUrl).toContain('map=basic_street-dark');
        // All parts, as the bare style ID implies — not just the hillshade the previous style kept.
        expect(styleUrl).toContain('trafficFlow=');
    });

    test('async handlers are awaited in registration order and the returned promise waits for them', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const order: string[] = [];
        tomtomMap.addStyleChangeHandler({
            onStyleAboutToChange: async () => {
                await flushMicrotasks();
                order.push('before-1');
            },
            onStyleChanged: async () => {
                await flushMicrotasks();
                order.push('after-1');
            },
        });
        tomtomMap.addStyleChangeHandler({
            onStyleAboutToChange: () => {
                order.push('before-2');
            },
            onStyleChanged: () => {
                order.push('after-2');
            },
        });

        const done = tomtomMap.setStyle('standardDark');
        // MapLibre has not been handed the style yet: the first handler is still preparing.
        expect(mapLibre.setStyle).not.toHaveBeenCalled();
        await flushMicrotasks();
        await flushMicrotasks();
        expect(order).toStrictEqual(['before-1', 'before-2']);
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(1);

        mapLibre.fireStyleLoad();
        await done;
        expect(order).toStrictEqual(['before-1', 'before-2', 'after-1', 'after-2']);
    });

    test('a failing handler is logged and does not block the others', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const second = vi.fn();
        tomtomMap.addStyleChangeHandler({
            onStyleChanged: async () => {
                throw new Error('boom');
            },
        });
        tomtomMap.addStyleChangeHandler({ onStyleChanged: second });

        const done = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
        expect(second).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    test('a newer setStyle supersedes one still in flight: only the last style is applied', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const changed = vi.fn();
        tomtomMap.addStyleChangeHandler({ onStyleChanged: changed });

        const first = tomtomMap.setStyle('standardDark');
        const second = tomtomMap.setStyle('monoLight');
        await flushMicrotasks();

        // Only the winning style reached MapLibre.
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(1);
        expect(mapLibre.setStyle.mock.lastCall?.[0]).toContain('map=basic_mono-light');
        expect(tomtomMap.getStyle()).toBe('monoLight');

        mapLibre.fireStyleLoad();
        await Promise.all([first, second]);
        expect(changed).toHaveBeenCalledTimes(1);
        expect(tomtomMap.mapReady).toBe(true);
    });

    // MapLibre aborts the request of a style it is asked to replace, but a response that had
    // already arrived is applied regardless. Two loads in flight at once could therefore land in
    // either order and leave the superseded style on the map, so a switch waits for the one in
    // flight before handing its own style over.
    test('a setStyle arriving mid-load hands its style over only once the load in flight is done', async () => {
        const { tomtomMap, mapLibre } = newMap();
        mapLibre.setStyle.mockClear();

        const first = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(1);
        expect(mapLibre.setStyle.mock.lastCall?.[0]).toContain('map=basic_street-dark');

        // The second call arrives while the first style is still loading: it must not reach
        // MapLibre yet, or the two loads would race each other.
        const second = tomtomMap.setStyle('monoLight');
        await flushMicrotasks();
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(1);

        // The style in flight arrives; only now is the second one handed over, so it is applied
        // last and wins.
        mapLibre.fireStyleLoad();
        await flushMicrotasks();
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(2);
        expect(mapLibre.setStyle.mock.lastCall?.[0]).toContain('map=basic_mono-light');

        mapLibre.fireStyleLoad();
        await Promise.all([first, second]);
        expect(tomtomMap.getStyle()).toBe('monoLight');
        expect(tomtomMap.mapReady).toBe(true);
    });

    // MapLibre diffs an unchanged style to no operations and returns without firing `style.load`,
    // so waiting for that event would never resolve. Re-applying the loaded style is exactly how
    // a caller asks for a reset, so the switch has to complete on the SDK's side instead.
    test('re-applying the style MapLibre already holds completes instead of waiting forever', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const changed = vi.fn();
        tomtomMap.addStyleChangeHandler({ onStyleChanged: changed });
        mapLibre.setStyle.mockClear();

        // No fireStyleLoad(): nothing would ever fire it, and this must resolve all the same.
        await tomtomMap.setStyle('standardLight', { resetState: true });

        expect(mapLibre.setStyle).not.toHaveBeenCalled();
        expect(changed).toHaveBeenCalledWith({ resetState: true });
        expect(tomtomMap.mapReady).toBe(true);
    });

    // A style that never arrives fires `error` and no `style.load`, so waiting for the load alone
    // would leave the caller — and `mapReady` — hanging for good.
    test('a style that fails to load rejects instead of waiting forever', async () => {
        const { tomtomMap, mapLibre } = newMap();
        const changed = vi.fn();
        tomtomMap.addStyleChangeHandler({ onStyleChanged: changed });

        const done = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        mapLibre.fireError({ error: new Error('Failed to fetch style') });

        await expect(done).rejects.toThrow('Failed to fetch style');
        expect(changed).not.toHaveBeenCalled();
        expect(tomtomMap.mapReady).toBe(false);
        // The style MapLibre holds did not change, so asking for it again is a real switch.
        mapLibre.setStyle.mockClear();
        const retry = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        expect(mapLibre.setStyle).toHaveBeenCalledTimes(1);
        mapLibre.fireStyleLoad();
        await retry;
        expect(tomtomMap.mapReady).toBe(true);
    });

    test('a tile or source failure does not fail the switch', async () => {
        const { tomtomMap, mapLibre } = newMap();

        const done = tomtomMap.setStyle('standardDark');
        await flushMicrotasks();
        mapLibre.fireError({ error: new Error('403 Forbidden'), sourceId: 'vectorTiles' });
        mapLibre.fireStyleLoad();
        await done;

        expect(tomtomMap.mapReady).toBe(true);
    });

    test('a custom style has its light/dark theme read off the loaded style', async () => {
        const { tomtomMap, mapLibre } = newMap();
        expect(tomtomMap.styleLightDarkTheme).toBe('light');

        mapLibre.styleLayers = [{ id: 'background', type: 'background', paint: { 'background-color': '#101418' } }];
        const done = tomtomMap.setStyle({ type: 'custom', url: 'https://example.com/dark-style.json' });
        // Until the style has loaded the SDK can only assume light.
        expect(tomtomMap.styleLightDarkTheme).toBe('light');
        await flushMicrotasks();
        mapLibre.fireStyleLoad();
        await done;

        expect(tomtomMap.styleLightDarkTheme).toBe('dark');
    });
});
