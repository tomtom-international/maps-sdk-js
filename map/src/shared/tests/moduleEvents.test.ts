import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ModuleEvents } from '../ModuleEvents';

type Config = { visible?: boolean };
type Shown = { count: number };

describe('ModuleEvents', () => {
    let configChangeHandlers: ((config: Config | undefined) => void)[];
    let shownFeaturesHandlers: ((features: Shown) => void)[];
    let events: ModuleEvents<Config, Shown>;

    beforeEach(() => {
        configChangeHandlers = [];
        shownFeaturesHandlers = [];
        events = new ModuleEvents<Config, Shown>(configChangeHandlers, shownFeaturesHandlers);
    });

    // The handler arrays are owned by the module and passed in by reference, so registering here
    // has to mutate them in place — a fresh array would silently detach from the module.
    test('appends config-change handlers to the module-owned array', () => {
        const first = vi.fn();
        const second = vi.fn();

        events.on('config-change', first);
        events.on('config-change', second);

        expect(configChangeHandlers).toEqual([first, second]);
    });

    test('appends shown-features handlers to the module-owned array', () => {
        const handler = vi.fn();

        events.on('shown-features', handler);

        expect(shownFeaturesHandlers).toEqual([handler]);
    });

    test('unsubscribe removes only the handler it belongs to', () => {
        const kept = vi.fn();
        const removed = vi.fn();
        events.on('config-change', kept);
        const unsubscribe = events.on('config-change', removed);

        unsubscribe();

        expect(configChangeHandlers).toEqual([kept]);
    });

    test('unsubscribe removes only its own shown-features handler', () => {
        const kept = vi.fn();
        const unsubscribe = events.on('shown-features', vi.fn());
        events.on('shown-features', kept);

        unsubscribe();

        expect(shownFeaturesHandlers).toEqual([kept]);
    });

    test('unsubscribing twice is harmless and leaves other handlers alone', () => {
        const kept = vi.fn();
        const unsubscribe = events.on('config-change', vi.fn());
        events.on('config-change', kept);

        unsubscribe();
        unsubscribe();

        expect(configChangeHandlers).toEqual([kept]);
    });

    test('unsubscribing after off() does not remove a later handler', () => {
        // off() empties the array; the stale unsubscribe must not then splice out whatever
        // happens to sit at the old index.
        const unsubscribe = events.on('config-change', vi.fn());
        events.off('config-change');
        const later = vi.fn();
        events.on('config-change', later);

        unsubscribe();

        expect(configChangeHandlers).toEqual([later]);
    });

    test('off clears one family and leaves the other intact', () => {
        events.on('config-change', vi.fn());
        events.on('config-change', vi.fn());
        events.on('shown-features', vi.fn());

        events.off('config-change');

        expect(configChangeHandlers).toEqual([]);
        expect(shownFeaturesHandlers).toHaveLength(1);
    });

    test('off clears shown-features handlers', () => {
        events.on('shown-features', vi.fn());
        events.on('config-change', vi.fn());

        events.off('shown-features');

        expect(shownFeaturesHandlers).toEqual([]);
        expect(configChangeHandlers).toHaveLength(1);
    });
});
