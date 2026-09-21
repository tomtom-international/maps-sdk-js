import type { EventScope } from './eventScope';
import type { ModuleEvents, ShownFeaturesType } from './ModuleEvents';
import type { EventHandlerConfig, EventType, UserEventHandler } from './types';
import type { UserEvents } from './UserEvents';

/**
 * Unified events interface that blends user interaction events and module lifecycle events
 * under a single `on` / `off` surface.
 *
 * User event types (`click`, `contextmenu`, `hover`, `long-hover`) are handled by the
 * underlying {@link UserEvents} instance and removed with {@link off}.
 *
 * Module lifecycle event types (`config-change`, `shown-features`) are handled by the
 * underlying {@link ModuleEvents} instance. Each `on` call returns an unsubscribe function.
 * Both user and module event types are also removable in bulk via {@link off}.
 *
 * Named scopes, where a module has them, hang off this object as properties and are themselves
 * `CombinedEvents` — so a scope carries the lifecycle events that module actually scopes.
 * {@link where} narrows ad hoc instead, and returns a plain {@link UserEvents}: a filter you build
 * on the spot has no lifecycle of its own.
 *
 * @typeParam T - Feature type surfaced by user interaction handlers.
 * @typeParam CFG - Module configuration type passed to `config-change` handlers.
 * @typeParam TShown - Data type passed to `shown-features` handlers. Use `never` for
 *   modules that have no `show` method.
 * @typeParam WHERE_SCOPE - Module-specific scope object accepted by {@link where}, in addition to a
 *   feature predicate. `never` for modules that only support predicates. Unrelated to a module's
 *   *named* scopes, which are properties on this object rather than an argument to it.
 *
 * @example
 * ```typescript
 * // User interaction
 * const unsub = places.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked place:', feature.properties.name);
 * });
 *
 * // Module lifecycle
 * const unsubConfig = places.events.on('config-change', (config) => {
 *   console.log('Config updated:', config);
 * });
 *
 * const unsubShown = places.events.on('shown-features', (features) => {
 *   console.log('Shown:', features);
 * });
 *
 * // Cleanup
 * unsub();
 * unsubConfig();
 * unsubShown();
 * places.events.off('click'); // also valid for user events
 * ```
 *
 * @group Events
 */
export class CombinedEvents<T, CFG, TShown = never, WHERE_SCOPE = never> {
    constructor(
        private readonly userEventsInstance: UserEvents<T, WHERE_SCOPE>,
        private readonly moduleEventsInstance: ModuleEvents<CFG, TShown>,
    ) {}

    /**
     * Narrows these events to part of what they cover — see {@link UserEvents.where}.
     *
     * @param scope See {@link EventScope} — a predicate over this module's feature type, or, where
     * the module supports one, a scope object such as `{ layerGroups }` on {@link BaseMapModule}.
     * @param config Event configuration for handlers registered through the returned instance, so
     * each scope can have its own hover cursor.
     * @returns A {@link UserEvents} covering only the narrowed set. Lifecycle events stay on the
     * module (or named scope) they belong to.
     *
     * @example
     * ```typescript
     * trafficIncidents.events.where((incident) => incident.properties.magnitude === 'major')
     *     .on('click', showIncidentDetails);
     * ```
     */
    where(scope: EventScope<T, WHERE_SCOPE>, config?: EventHandlerConfig): UserEvents<T, WHERE_SCOPE> {
        return this.userEventsInstance.where(scope, config);
    }

    /**
     * Subscribe to a user interaction event (`click`, `contextmenu`, `hover`, `long-hover`).
     *
     * @param type - The user event type.
     * @param handler - Called with the feature, click/hover coordinates, all features at the
     *   point, and the source configuration.
     * @returns An unsubscribe function. Call it to remove **only this handler**.
     *
     * @example
     * ```typescript
     * const unsub = places.events.on('click', (feature, lngLat) => {
     *   showPlaceDetails(feature.properties);
     * });
     * unsub(); // remove only this handler
     * ```
     */
    on(type: EventType, handler: UserEventHandler<T>): () => void;
    /**
     * Subscribe to config-change events.
     *
     * Fires after any configuration mutation — `applyConfig`, `setVisible`, or any
     * module-specific setter. The handler receives the module's full updated configuration.
     *
     * @param type - `'config-change'`
     * @param handler - Receives the module's config (or `undefined` when config is cleared).
     * @returns An unsubscribe function. Call it to remove **only this handler**.
     *
     * @example
     * ```typescript
     * const unsub = trafficFlow.events.on('config-change', (config) => {
     *   toggle.checked = config?.visible ?? false;
     * });
     * unsub();
     * ```
     */
    on(type: 'config-change', handler: (config: CFG | undefined) => void): () => void;
    /**
     * Subscribe to shown-features events.
     *
     * Fires immediately after the module's `show()` method (or equivalent) has rendered
     * new data on the map. Only available on modules that have a `show` method.
     *
     * @param type - `'shown-features'`
     * @param handler - Receives the data that was passed to `show()`.
     * @returns An unsubscribe function. Call it to remove **only this handler**.
     *
     * @example
     * ```typescript
     * const unsub = places.events.on('shown-features', (features) => {
     *   fitMapToResults(features);
     * });
     * unsub();
     * ```
     */
    on(type: ShownFeaturesType<TShown>, handler: (features: TShown) => void): () => void;
    on(
        type: EventType | 'config-change' | 'shown-features',
        handler: UserEventHandler<T> | ((config: CFG | undefined) => void) | ((features: TShown) => void),
    ): () => void {
        if (type === 'config-change') {
            return this.moduleEventsInstance.on('config-change', handler as (config: CFG | undefined) => void);
        }

        if (type === 'shown-features') {
            // The overload keeps `shown-features` off modules with no `show`; inside the class the
            // literal has to be re-asserted, since `ShownFeaturesType` is still generic here.
            return this.moduleEventsInstance.on(
                'shown-features' as ShownFeaturesType<TShown>,
                handler as (features: TShown) => void,
            );
        }

        return this.userEventsInstance.on(type, handler as UserEventHandler<T>);
    }

    /**
     * Remove **all** handlers for the given event type at once.
     *
     * Accepts both user interaction types (`click`, `contextmenu`, `hover`, `long-hover`) and
     * module lifecycle types (`config-change`, `shown-features`).
     *
     * Prefer the unsubscribe function returned by {@link on} when you need to remove a single
     * handler. Use `off` for bulk teardown — e.g. when unmounting a component that registered
     * multiple handlers of the same type.
     *
     * @param type - The event type whose handlers should all be cleared.
     *
     * @example
     * ```typescript
     * places.events.off('click');          // clear all click handlers
     * places.events.off('config-change');  // clear all config-change handlers
     * ```
     */
    off(type: EventType | 'config-change' | 'shown-features'): void {
        if (type === 'config-change' || type === 'shown-features') {
            this.moduleEventsInstance.off(type);
        } else {
            this.userEventsInstance.off(type);
        }
    }
}
