import type { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Reactively read a snapshot off `agent.state` that re-renders whenever any of the named events
 * fires on a state slice. Lives in the demo (not the plugin) — wires the plugin's typed event
 * surface into React via `useSyncExternalStore`, no polling.
 *
 * The plugin's state slices mutate their internal arrays in place (e.g. `PlacesState.addPlaceResult`
 * does `this._datasets.push(...)`) and their getters return the same reference. `useSyncExternalStore`
 * compares snapshots via `Object.is`, so naive `() => state.places.datasets` would never trigger a
 * re-render even though the array's contents changed.
 *
 * The hook reconciles this by holding the latest snapshot in a wrapper object (`{ value }`) that
 * gets *replaced* on every event — guaranteeing identity churn. Between events, every call to
 * `getSnapshot` returns the same wrapper (referentially stable), so React's tear-detection stays
 * happy.
 */
export type Agent = ReturnType<typeof createMapAgent>;
type AnyEvents = { on(type: string, handler: () => void): () => void };
type EventBinding = { events: AnyEvents; types: readonly string[] };

// State slices mutate their arrays in place (`PlacesState.addPlaceResult` calls `Array.push`),
// so two consecutive `state.places.datasets` reads return the same reference even when contents
// changed. Shallow-copying arrays here gives downstream `useMemo` / prop-comparison checks a
// fresh reference whenever an event fires — without forcing every consumer to remember a spread.
const refreshSnapshot = <T>(value: T): T => (Array.isArray(value) ? ([...value] as unknown as T) : value);

export function useAgentSnapshot<T>(bindings: readonly EventBinding[], snapshot: () => T): T {
    // Cache the latest value in a wrapper. We replace the wrapper on each event so `getSnapshot`
    // returns a different reference (React picks up the change) AND ensure the wrapped value is
    // itself a fresh reference for arrays (so consumer `useMemo` deps invalidate too).
    const cache = useRef<{ value: T }>({ value: refreshSnapshot(snapshot()) });
    const snapshotRef = useRef(snapshot);
    snapshotRef.current = snapshot;

    const subscribe = useCallback(
        (notify: () => void) => {
            const onEvent = () => {
                cache.current = { value: refreshSnapshot(snapshotRef.current()) };
                notify();
            };
            const unsubs = bindings.flatMap((b) => b.types.map((t) => b.events.on(t, onEvent)));
            return () => unsubs.forEach((u) => u());
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [bindings],
    );

    const getSnapshot = useCallback(() => cache.current, []);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).value;
}

/** Convenience: subscribe to a single slice and a single event type. Same caching trick as `useAgentSnapshot`. */
export function useSliceSnapshot<TEvents extends AnyEvents, T>(events: TEvents, type: string, snapshot: () => T): T {
    const cache = useRef<{ value: T }>({ value: refreshSnapshot(snapshot()) });
    const snapshotRef = useRef(snapshot);
    snapshotRef.current = snapshot;

    const subscribe = useCallback(
        (notify: () => void) =>
            events.on(type, () => {
                cache.current = { value: refreshSnapshot(snapshotRef.current()) };
                notify();
            }),
        [events, type],
    );

    const getSnapshot = useCallback(() => cache.current, []);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).value;
}

/**
 * Subscribe to a map module's `config-change` events. Lazily initializes the module via the
 * provided async getter so the panel only spins it up when mounted.
 *
 * Receives the module's config after every change. Each event carries the config as the module
 * holds it, so whether it is the whole state depends on the module: BaseMapModule's `groups`
 * records every group call.
 *
 * Doesn't read the module's current config on mount because no public getter exists; consumers
 * should keep their own initial state and let inbound events overwrite it.
 */
type ConfigChangeModule<TConfig> = {
    events: { on(type: 'config-change', handler: (config: TConfig | undefined) => void): () => void };
};

export function useModuleConfigChange<TConfig>(
    getModule: () => Promise<ConfigChangeModule<TConfig>>,
    onChange: (config: TConfig | undefined) => void,
): void {
    // Keep a fresh-handler ref so subscription setup runs once per module-getter change, but
    // the handler always reads the latest closure when the module fires.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });
    useEffect(() => {
        let cancelled = false;
        let unsub: (() => void) | undefined;
        getModule().then((module) => {
            if (cancelled) return;
            unsub = module.events.on('config-change', (config) => onChangeRef.current(config));
        });
        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [getModule]);
}
