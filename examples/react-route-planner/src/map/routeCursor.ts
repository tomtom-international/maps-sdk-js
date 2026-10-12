import { useState, useSyncExternalStore } from 'react';

/** A point of interest along one of the routes: hovered on the map or on the sections bar. */
export type RouteCursor = { routeIndex: number; distanceInMeters: number; from: 'map' | 'bar' };

export type RouteCursorStore = {
    get: () => RouteCursor | undefined;
    set: (cursor?: RouteCursor) => void;
    subscribe: (listener: () => void) => () => void;
};

// Outside React state: a pointer move re-renders only what reads the cursor, not the whole planner.
const createRouteCursorStore = (): RouteCursorStore => {
    let cursor: RouteCursor | undefined;
    const listeners = new Set<() => void>();
    return {
        get: () => cursor,
        set: (next) => {
            cursor = next;
            for (const listener of listeners) listener();
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
};

export const useRouteCursorStore = () => useState(createRouteCursorStore)[0];

export const useRouteCursor = (store: RouteCursorStore) => useSyncExternalStore(store.subscribe, store.get);
