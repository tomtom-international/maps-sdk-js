/**
 * Lifecycle event module for map modules.
 *
 * Provides a unified API for subscribing to module-level events that are not tied
 * to user interaction with map features. Two event types are supported:
 *
 * - `config-change`: emitted whenever the module's configuration is updated
 *   (via `applyConfig`, `resetConfig`, or any module-specific setter that mutates config).
 * - `shown-features`: emitted by modules that have a `show` method, immediately after
 *   features are displayed on the map.
 *
 * Each `on()` call returns an unsubscribe function so individual handlers can be
 * removed without clearing the entire listener list.
 *
 * @typeParam TConfig - The module's configuration type.
 * @typeParam TShownFeatures - The type of data passed to `show()`. Use `never` for
 *   modules that have no `show` method.
 *
 * @example
 * ```typescript
 * const unsubscribeConfig = trafficFlow.events.on('config-change', (config) => {
 *   console.log('New config:', config);
 * });
 *
 * const unsubscribeShown = places.events.on('shown-features', (features) => {
 *   console.log('Shown:', features);
 * });
 *
 * // Later:
 * unsubscribeConfig();
 * unsubscribeShown();
 * ```
 *
 * @group Events
 */
export class ModuleEvents<TConfig, TShownFeatures = never> {
    constructor(
        private readonly configChangeHandlers: ((config: TConfig | undefined) => void)[],
        private readonly shownFeaturesHandlers: ((features: TShownFeatures) => void)[],
    ) {}

    /**
     * Subscribe to config-change events.
     *
     * The handler is called with the module's full current configuration immediately after
     * any mutation — whether through `applyConfig`, a module-specific setter, or `resetConfig`.
     *
     * @param type - `'config-change'`
     * @param handler - Receives the module's config (or `undefined` when config is cleared).
     * @returns An unsubscribe function. Call it to remove **only this handler** without
     *   affecting other registered handlers for the same event type.
     *
     * @example
     * ```typescript
     * const unsub = trafficFlow.events.on('config-change', (config) => {
     *   toggle.checked = config?.visible ?? false;
     * });
     *
     * // Later:
     * unsub();
     * ```
     */
    on(type: 'config-change', handler: (config: TConfig | undefined) => void): () => void;
    /**
     * Subscribe to shown-features events.
     *
     * The handler is called immediately after a module's `show()` method (or equivalent)
     * has updated the map with new data. Only available on modules that have a `show` method.
     *
     * @param type - `'shown-features'`
     * @param handler - Receives the data that was passed to `show()`.
     * @returns An unsubscribe function. Call it to remove **only this handler** without
     *   affecting other registered handlers for the same event type.
     *
     * @example
     * ```typescript
     * const unsub = places.events.on('shown-features', (features) => {
     *   fitMapToResults(features);
     * });
     *
     * // Later:
     * unsub();
     * ```
     */
    on(type: 'shown-features', handler: (features: TShownFeatures) => void): () => void;
    on(
        type: 'config-change' | 'shown-features',
        handler: ((config: TConfig | undefined) => void) | ((features: TShownFeatures) => void),
    ): () => void {
        if (type === 'config-change') {
            const configHandler = handler as (config: TConfig | undefined) => void;
            this.configChangeHandlers.push(configHandler);
            return () => {
                const index = this.configChangeHandlers.indexOf(configHandler);
                if (index !== -1) {
                    this.configChangeHandlers.splice(index, 1);
                }
            };
        }

        const shownHandler = handler as (features: TShownFeatures) => void;
        this.shownFeaturesHandlers.push(shownHandler);
        return () => {
            const index = this.shownFeaturesHandlers.indexOf(shownHandler);
            if (index !== -1) {
                this.shownFeaturesHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Remove **all** handlers for the given event type at once.
     *
     * Prefer the unsubscribe function returned by {@link on} when you need to remove a
     * single handler. Use `off` for bulk teardown — e.g. when unmounting a component that
     * registered multiple handlers.
     *
     * @param type - The event type whose handlers should all be cleared.
     *
     * @example
     * ```typescript
     * // Clear all config-change listeners in one call
     * trafficFlow.events.off('config-change');
     * ```
     */
    off(type: 'config-change' | 'shown-features'): void {
        if (type === 'config-change') {
            this.configChangeHandlers.length = 0;
        } else {
            this.shownFeaturesHandlers.length = 0;
        }
    }
}
