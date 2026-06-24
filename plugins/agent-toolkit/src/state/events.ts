/**
 * @module agent-toolkit-state
 *
 * Tiny typed event emitter used by every state slice (PlacesState, RoutingState, ...) to notify
 * subscribers when their internals change. The shape mirrors the SDK's `ModuleEvents` API
 * (`on(type, handler) => unsubscribe`, `off(type)`) so consumers see one consistent pattern across
 * the SDK and the agent toolkit. Designed to plug straight into React's `useSyncExternalStore`.
 *
 * @group Agent Toolkit
 */

/**
 * Generic typed event bus. The `EventMap` parameter declares the set of event names this emitter
 * supports along with each event's payload type — `on` and `emit` are then strongly typed against it.
 *
 * Usage from outside the slice (subscribe-only):
 * ```ts
 * const unsub = state.places.events.on('entries-change', ({ entries }) => render(entries));
 * // ...
 * unsub();
 * ```
 *
 * @group Agent Toolkit
 */
export class StateEvents<EventMap extends Record<string, unknown>> {
    private readonly handlers: { [K in keyof EventMap]?: ((payload: EventMap[K]) => void)[] } = {};

    /**
     * Subscribe to an event. Returns an unsubscribe function that removes only this handler.
     */
    on<K extends keyof EventMap>(type: K, handler: (payload: EventMap[K]) => void): () => void {
        const list = this.handlers[type] ?? (this.handlers[type] = []);
        list.push(handler);
        return () => {
            const current = this.handlers[type];
            if (!current) return;
            const idx = current.indexOf(handler);
            if (idx !== -1) current.splice(idx, 1);
        };
    }

    /** Remove all handlers for a given event type. Use the unsubscribe from `on` for single-handler removal. */
    off<K extends keyof EventMap>(type: K): void {
        if (this.handlers[type]) this.handlers[type]!.length = 0;
    }

    /**
     * Fire an event. Internal — only the owning slice should call this. We don't make it `protected`
     * because slices hold an instance via composition (not inheritance), and the alternative
     * (subclassing per slice) bloats the public API surface.
     *
     * @internal
     */
    emit<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
        const list = this.handlers[type];
        if (!list?.length) return;
        // Iterate over a snapshot so a handler that unsubscribes mid-dispatch can't cause
        // others on the same tick to be skipped.
        for (const handler of [...list]) handler(payload);
    }

    /** Drop every handler for every type. Used by slice `reset()` to detach lingering listeners. */
    clear(): void {
        for (const key of Object.keys(this.handlers) as (keyof EventMap)[]) {
            this.handlers[key] = [];
        }
    }
}
