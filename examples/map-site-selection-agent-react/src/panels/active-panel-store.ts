import { useSyncExternalStore } from 'react';

// The result panels share the same corner of the map, so only the most-recently-activated one is
// shown. When a new analysis publishes its panel it moves to the top and the others hide; closing the
// top one reveals the previous panel again. Mirrors the useSyncExternalStore pattern of the result
// stores so panels stay plain components.

export type PanelId = 'profile' | 'shortlist' | 'overlap' | 'whitespace';

let order: PanelId[] = []; // currently-active panels, most-recent last
const listeners = new Set<() => void>();

/** Mark a panel active/inactive. Call from an effect (it mutates module state + notifies). */
export const setPanelActive = (id: PanelId, active: boolean): void => {
    const without = order.filter((p) => p !== id);
    const next = active ? [...without, id] : without;
    const unchanged = next.length === order.length && next.every((p, i) => p === order[i]);
    if (unchanged) return;
    order = next;
    for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** True only for the top (newest active) panel — the one that should currently be visible. */
export const useIsTopPanel = (id: PanelId): boolean =>
    useSyncExternalStore(subscribe, () => order[order.length - 1] === id);
