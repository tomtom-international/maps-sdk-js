import type { Map, MapGeoJSONFeature } from 'maplibre-gl';
import type { TomTomMap } from '../TomTomMap';
import { CombinedEvents } from './CombinedEvents';
import type { EventsProxy } from './EventsProxy';
import { assertNoReservedScopeNames, type ResolvedEventScope } from './eventScope';
import { LayerFilterComposer } from './layers/layerFilterComposer';
import { ModuleEvents } from './ModuleEvents';
import { waitUntilMapIsReady } from './mapUtils';
import type { MapModuleCommonConfig, SourcesWithLayers, SourceWithLayerIDs } from './types';
import { UserEvents } from './UserEvents';

/**
 * How a module builds user events over some of its sources.
 * @ignore
 */
type EventScopeOptions<T, WHERE_SCOPE> = {
    /** Turns a raw MapLibre feature into the feature type this scope exposes. */
    mapping?: (feature: MapGeoJSONFeature) => T;
    /** Resolves a module-specific scope object, such as BaseMapModule's `{ layerGroups }`. */
    scopeResolver?: (scope: WHERE_SCOPE) => ResolvedEventScope;
};

/**
 * Base class for all Maps SDK map modules.
 *
 * This abstract class provides the foundation for creating map modules that can display
 * and manage various types of data on a TomTom map. It handles module lifecycle management,
 * including initialization, configuration updates, and automatic restoration after map style changes.
 *
 * @remarks
 * All map modules extend this class to ensure consistent behavior across the SDK.
 * The class manages the module's sources, layers, and configuration, automatically
 * handling map style changes by restoring the module's state when needed.
 *
 * No module extends this class directly. Each one extends the subclass that says who owns the
 * sources and layers it controls, and therefore how its instances behave:
 *
 * - {@link AbstractDataOwnedMapModule} — the module adds and owns its own sources, layers and
 *   images, suffixed per instance. Multi-instance, built with `create(map, config?)`.
 * - {@link AbstractStyleOwnedMapModule} — the module controls sources and layers the map style
 *   already provides, under fixed global IDs. A shared controller, obtained with
 *   `get(map, config?)`.
 *
 * @typeParam SOURCES_WITH_LAYERS - The type defining the sources and layers used by this module
 * @typeParam CFG - The configuration type for this module, or undefined if no configuration is needed. When defined, must extend MapModuleCommonConfig.
 *
 * @example
 * ```typescript
 * class CustomModule extends AbstractDataOwnedMapModule<MySourcesWithLayers, MyConfig> {
 *   constructor(tomtomMap: TomTomMap, config?: MyConfig) {
 *     super(tomtomMap, config);
 *   }
 *   // Implement abstract methods...
 * }
 * ```
 *
 * @group Shared
 */
export abstract class AbstractMapModule<
    SOURCES_WITH_LAYERS extends SourcesWithLayers,
    CFG extends MapModuleCommonConfig | undefined = undefined,
> {
    /**
     * @ignore
     */
    protected readonly tomtomMap: TomTomMap;
    /**
     * @ignore
     */
    protected readonly eventsProxy: EventsProxy;
    /**
     * @ignore
     */
    protected readonly mapLibreMap: Map;
    /**
     * @ignore
     */
    protected sourcesWithLayers!: SOURCES_WITH_LAYERS;
    /**
     * @ignore
     */
    protected _sourceAndLayerIDs!: Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
    /**
     * @ignore
     */
    protected config?: CFG;
    /**
     * @ignore
     */
    protected _initializing = true;

    /**
     * Handlers registered via events.on('config-change', …).
     * Stored here so the array reference stays stable across multiple events getter calls.
     * @ignore
     */
    protected readonly configChangeHandlers: ((config: CFG | undefined) => void)[] = [];

    /**
     * Monotonically increasing index unique to this instance within its concrete module
     * class. Auto-assigned in the constructor based on `new.target`, so each subclass
     * has its own counter without per-subclass boilerplate. Use as a suffix on
     * auto-generated source and layer IDs to keep them stable across style changes and
     * unique across module instances.
     *
     * Only the data-owned modules need it, because the style-owned ones work under fixed global
     * IDs. It is assigned here all the same: this constructor already runs
     * `_initSourcesWithLayers`, which reads it, so a subclass field would be assigned too late.
     * @ignore
     */
    protected readonly instanceIndex: number;

    /**
     * The map's single owner of a **style** layer's `filter`. Several modules narrow the same style
     * layer, so none of them calls `setFilter` on one directly: the composer is what keeps one from
     * dropping another's work, and what holds the filter the style itself shipped. A module may
     * still set the filter of a layer it added and owns alone.
     *
     * Assigned in this constructor, which already runs `_initSourcesWithLayers` and `applyConfig`,
     * so a subclass field would be assigned too late for either to use it.
     * @ignore
     */
    protected readonly filterComposer: LayerFilterComposer;

    /**
     * Per-concrete-class instance counter. WeakMap-keyed so unloaded classes can be GC'd.
     * @ignore
     */
    private static readonly instanceCounters = new WeakMap<Function, number>();

    /**
     * Indicates that this module is currently adding its sources and layers to the map, so during this time it might not function properly.
     * @see waitUntilModuleReady
     * @private
     */
    private moduleReady = false;

    /**
     * Builds this module based on a given Maps SDK map.
     * @param tomtomMap The map. It may or may not be initialized at this stage,
     * but the module ensures to initialize itself once it is.
     * @param config Optional configuration to initialize directly as soon as the map is ready.
     */
    protected constructor(tomtomMap: TomTomMap, config?: CFG) {
        const concreteClass = new.target;
        const previousIndex = AbstractMapModule.instanceCounters.get(concreteClass) ?? -1;
        this.instanceIndex = previousIndex + 1;
        AbstractMapModule.instanceCounters.set(concreteClass, this.instanceIndex);

        this.tomtomMap = tomtomMap;
        this.eventsProxy = tomtomMap._eventsProxy;
        this.mapLibreMap = tomtomMap.mapLibreMap;
        this.filterComposer = LayerFilterComposer.for(tomtomMap);
        // TODO: we need to find a cleaner separation between initSourcesWithLayers and applyConfig for most modules to prevent double work, particularly with adding layers
        this.initSourcesWithLayers(config);
        this.applyConfig(config);
        this.tomtomMap.addStyleChangeHandler({
            onStyleAboutToChange: () => {
                this.moduleReady = false;
            },
            onStyleChanged: ({ resetState }) => (resetState ? this.resetOnNewStyle() : this.restoreDataAndConfig()),
            priority: this.styleChangePriority(),
        });
        this._initializing = false;
    }

    /**
     * Where this module restores itself in the style-change sequence (see
     * {@link StyleChangeHandler.priority}). Data and visibility modules keep the default; a module
     * whose work must land on top of theirs returns a higher value.
     * @protected
     * @ignore
     */
    protected styleChangePriority(): number {
        return 0;
    }

    /**
     * Initializes the sources with layers of this module.
     * @param config The optional configuration for the module.
     * @param restore Whether we are restoring an existing module after the map style got reloaded.
     * @protected
     * @ignore
     */
    protected initSourcesWithLayers(config?: CFG, restore?: boolean): void {
        this.moduleReady = false;
        this.sourcesWithLayers = this._initSourcesWithLayers(config, restore);
        this._sourceAndLayerIDs = Object.fromEntries(
            Object.entries(this.sourcesWithLayers).map(([name, sourceWithLayers]) => [
                name,
                sourceWithLayers.sourceAndLayerIDs,
            ]),
        ) as Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs>;
        if (restore) {
            // Passing `this` lets the proxy re-resolve only this module's scopes: POIs and the
            // base map share the `vectorTiles` source ID, so source ID alone cannot tell them apart.
            this.eventsProxy.updateIfRegistered(this.sourcesWithLayers, this);
        }
        // Only if the map is still ready, we consider that the module is ready.
        // Otherwise, we assume there's a quick style change in progress and expect that'll trigger the module to restore itself again.
        if (this.tomtomMap.mapReady) {
            this.moduleReady = true;
        }
    }

    /**
     * Initializes the sources with layers for the specific module.
     * @protected
     * @ignore
     */
    protected abstract _initSourcesWithLayers(config?: CFG, restore?: boolean): SOURCES_WITH_LAYERS;

    protected async waitUntilModuleReady(): Promise<void> {
        await waitUntilMapIsReady(this.tomtomMap);
        if (!this.moduleReady) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (this.tomtomMap.mapReady && this.moduleReady) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 200);
            });
        }
    }

    /**
     * Applies a configuration to this module.
     *
     * This method updates the module's behavior and appearance based on the provided configuration.
     * The configuration is stored internally and will be automatically reapplied if the map style changes.
     *
     * @param config - The configuration object to apply to the module. Pass `undefined` to reset
     * the configuration to default values.
     *
     * @remarks
     * When a configuration is applied, the module updates its visual representation and behavior
     * accordingly. The configuration persists across map style changes, ensuring consistent
     * module behavior even when the map's base style is modified.
     *
     * Unless a module documents otherwise, the given configuration **replaces** the current one
     * rather than being merged into it. To change one part of it, spread the current
     * configuration into the new one: `myModule.applyConfig({ ...myModule.getConfig(), theme })`.
     *
     * @example
     * ```typescript
     * // Apply a new configuration
     * myModule.applyConfig({ visible: true, opacity: 0.8 });
     *
     * // Reset to default configuration
     * myModule.applyConfig(undefined);
     * ```
     *
     * @see {@link resetConfig} for a convenience method to reset configuration
     * @see {@link getConfig} to retrieve the current configuration
     */
    applyConfig(config: CFG | undefined) {
        this.config = this._applyConfig(config);
        this.emitConfigChange();
    }

    /**
     * Emits a `config-change` event to all registered handlers.
     * Skipped during module initialisation to avoid spurious events.
     * @ignore
     */
    protected emitConfigChange(): void {
        if (this._initializing) return;

        for (const handler of this.configChangeHandlers) {
            handler(this.config);
        }
    }

    /**
     * Internal implementation to apply config for the specific module.
     * @param config The config to apply. this.config contains the previous configuration (if any).
     * Once the method returns config, it will be assigned to this.config.
     * @protected
     * @ignore
     */
    protected abstract _applyConfig(config: CFG | undefined): CFG | undefined;

    /**
     * Resets the configuration of this module to its default values.
     *
     * This is a convenience method that clears any previously applied configuration
     * and restores the module to its initial state. This is equivalent to calling
     * `applyConfig(undefined)`.
     *
     * @remarks
     * After calling this method, the module will behave as if no configuration was ever applied.
     * Any custom settings, styling, or behavior modifications will be removed and replaced
     * with default values.
     *
     * @example
     * ```typescript
     * // Apply some configuration
     * myModule.applyConfig({ visible: true, opacity: 0.5 });
     *
     * // Later, reset to defaults
     * myModule.resetConfig();
     * ```
     *
     * @see {@link applyConfig} to apply a new configuration
     * @see {@link getConfig} to retrieve the current configuration before resetting
     */
    resetConfig(): void {
        this.applyConfig(undefined);
    }

    // Runs while `TomTomMap` notifies its style-change handlers, so `setStyle` only resolves once
    // every module is back. The new style is fully applied by then: the SDK waits for MapLibre's
    // `style.load`, which fires once all the layers of the new style are in place.
    private restoreDataAndConfig(): void {
        // defensively declaring the module as not ready to prevent race conditions:
        this.moduleReady = false;
        this.restoreDataAndConfigImpl();
    }

    // The clean-switch counterpart of restoreDataAndConfig (`setStyle(style, { resetState: true })`):
    // the module re-binds to the new style with default configuration and nothing shown, so it
    // stays usable — a stale module over a style that no longer has its layers would not be.
    private resetOnNewStyle(): void {
        this.moduleReady = false;
        this.config = undefined;
        this.discardShownData();
        this.initSourcesWithLayers(undefined, true);
        this._applyConfig(undefined);
        this.emitConfigChange();
    }

    /**
     * Forgets whatever this module remembers beyond its configuration, so that a clean style
     * switch does not bring it back. The sources are rebuilt empty right after, so there is
     * nothing to clear on the map.
     *
     * A data-owned module always remembers something, so {@link AbstractDataOwnedMapModule} makes
     * this abstract. A style-owned module overrides it only when it keeps state of its own, such
     * as raw layer edits.
     * @protected
     * @ignore
     */
    protected discardShownData(): void {
        // Deliberately empty: a style-owned module remembers nothing beyond its configuration
        // unless it says otherwise, and the ones that do override this.
    }

    /**
     * implementation needed to restore the module state (data and config applied to the module).
     * to be used to restore module state after map style change
     * @protected
     * @ignore
     */
    protected restoreDataAndConfigImpl(): void {
        this.initSourcesWithLayers(this.config, true);
        this._applyConfig(this.config);
    }

    /**
     * Retrieves a copy of the current module configuration.
     *
     * This method returns a shallow copy of the configuration object that is currently
     * applied to the module. If no configuration has been applied, it returns `undefined`.
     *
     * @returns A shallow copy of the current configuration object, or `undefined` if no
     * configuration is currently applied. The returned object is a copy to prevent
     * unintended modifications to the internal state.
     *
     * @remarks
     * The returned configuration object is a shallow copy, which means that while the
     * top-level properties are copied, any nested objects or arrays are still referenced
     * from the original configuration. This is sufficient for most use cases but should
     * be kept in mind when dealing with complex configurations.
     *
     * @example
     * ```typescript
     * // Apply a configuration
     * myModule.applyConfig({ visible: true, opacity: 0.8 });
     *
     * // Later, retrieve the current configuration
     * const currentConfig = myModule.getConfig();
     * console.log(currentConfig); // { visible: true, opacity: 0.8 }
     *
     * // When no config is applied
     * myModule.resetConfig();
     * console.log(myModule.getConfig()); // undefined
     * ```
     *
     * @see {@link applyConfig} to modify the configuration
     * @see {@link resetConfig} to clear the configuration
     */
    getConfig() {
        return this.config && { ...this.config };
    }

    /**
     * Gets the source and layer identifiers for all sources managed by this module.
     *
     * This property provides access to the MapLibre source and layer IDs that were created
     * and are managed by this module. These IDs can be used to interact directly with
     * MapLibre's API or to identify which layers belong to this module.
     *
     * @returns A record mapping each source name to its corresponding source ID and layer IDs.
     * Each entry contains the MapLibre source identifier and an array of layer identifiers
     * associated with that source.
     *
     * @remarks
     * The returned IDs are useful when you need to:
     * - Directly manipulate layers using MapLibre's native API
     * - Identify which layers on the map belong to this module
     * - Set layer ordering or positioning relative to other layers
     * - Access source or layer properties through MapLibre methods
     *
     * @example
     * ```typescript
     * const ids = myModule.sourceAndLayerIDs;
     * console.log(ids);
     * // {
     * //   mySource: {
     * //     sourceID: 'my-source-id',
     * //     layerIDs: ['layer-1', 'layer-2']
     * //   }
     * // }
     *
     * // Use with MapLibre API
     * const map = myModule.mapLibreMap;
     * ids.mySource.layerIDs.forEach(layerId => {
     *   map.setLayoutProperty(layerId, 'visibility', 'visible');
     * });
     * ```
     */
    get sourceAndLayerIDs(): Record<keyof SOURCES_WITH_LAYERS, SourceWithLayerIDs> {
        return this._sourceAndLayerIDs;
    }

    /**
     * User events over the named sources of this module — what every named scope is.
     *
     * `sourceNames` may list several sources when they carry the same data in different display
     * modes — clustered and unclustered places, or the hexgrid/square/heatmap trio — and missing
     * ones are skipped, so an optional source costs the caller nothing.
     *
     * A scope carries no lifecycle events: a module has one configuration and one `show` stream,
     * neither of which a scope narrows. Both live on the module's own `events`.
     * @ignore
     */
    protected userEvents<T = MapGeoJSONFeature, WHERE_SCOPE = never>(
        sourceNames: (keyof SOURCES_WITH_LAYERS)[],
        options: EventScopeOptions<T, WHERE_SCOPE> = {},
    ): UserEvents<T, WHERE_SCOPE> {
        return new UserEvents<T, WHERE_SCOPE>({
            eventProxy: this.eventsProxy,
            sourcesWithLayers: sourceNames
                .map((name) => this.sourcesWithLayers[name])
                .filter((sourceWithLayers) => !!sourceWithLayers),
            owner: this,
            config: this.config?.events,
            mapping: options.mapping,
            scopeResolver: options.scopeResolver,
        });
    }

    /**
     * The event surface of a module with no `show`: user events over the named sources, plus
     * `config-change`. `shown-features` is not subscribable here — `TShown` is `never`, which
     * makes the overload uncallable.
     * @ignore
     */
    protected moduleEvents<T = MapGeoJSONFeature, WHERE_SCOPE = never>(
        sourceNames: (keyof SOURCES_WITH_LAYERS)[],
        options: EventScopeOptions<T, WHERE_SCOPE> = {},
    ): CombinedEvents<T, CFG, never, WHERE_SCOPE> {
        return new CombinedEvents<T, CFG, never, WHERE_SCOPE>(
            this.userEvents<T, WHERE_SCOPE>(sourceNames, options),
            new ModuleEvents<CFG, never>(this.configChangeHandlers, []),
        );
    }

    /**
     * The event surface of a module that has a `show`. `shownFeaturesHandlers` is passed
     * positionally, and must be the very array `show` iterates: handing over a throwaway would
     * accept subscriptions that can never fire.
     * @ignore
     */
    protected moduleEventsWithShown<T, TShown, WHERE_SCOPE = never>(
        sourceNames: (keyof SOURCES_WITH_LAYERS)[],
        shownFeaturesHandlers: ((features: TShown) => void)[],
        options: EventScopeOptions<T, WHERE_SCOPE> = {},
    ): CombinedEvents<T, CFG, TShown, WHERE_SCOPE> {
        return new CombinedEvents<T, CFG, TShown, WHERE_SCOPE>(
            this.userEvents<T, WHERE_SCOPE>(sourceNames, options),
            new ModuleEvents<CFG, TShown>(this.configChangeHandlers, shownFeaturesHandlers),
        );
    }

    /**
     * Attaches named scopes to the module's event surface, so `events.on(...)` and
     * `events.<scope>.on(...)` live on one object.
     *
     * A module only declares scopes where it manages more than one surface; with a single source,
     * `events` already is that scope and a named alias would just duplicate it.
     *
     * The two scope type parameters are unrelated, and a module typically has one or the other:
     * `NAMED_SCOPES` is the object of scopes hung off `events` as properties (RoutingModule's
     * `mainLines`, `waypoints`, …), while `WHERE_SCOPE` is the scope object `events.where(…)`
     * accepts as an argument (BaseMapModule's `{ layerGroups }`).
     * @ignore
     */
    protected buildEvents<T, TShown, WHERE_SCOPE, NAMED_SCOPES extends object>(
        moduleWide: CombinedEvents<T, CFG, TShown, WHERE_SCOPE>,
        scopes: NAMED_SCOPES,
    ): CombinedEvents<T, CFG, TShown, WHERE_SCOPE> & NAMED_SCOPES {
        assertNoReservedScopeNames(Object.keys(scopes), this.constructor.name);
        return Object.assign(moduleWide, scopes);
    }
}
