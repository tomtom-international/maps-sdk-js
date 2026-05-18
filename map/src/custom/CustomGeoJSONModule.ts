import type { FeatureCollection } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { ToBeAddedLayerSpec, ToBeAddedLayerSpecWithoutSource } from '../shared';
import { AbstractMapModule, CombinedEvents, GeoJSONSourceWithLayers, ModuleEvents, UserEvents } from '../shared';
import { addLayers, updateLayersAndSource, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import type { CustomGeoJSONModuleConfig } from './types/customGeoJSONModuleConfig';

type CustomGeoJSONSourcesWithLayers<TSources extends Record<string, FeatureCollection>> = {
    [K in keyof TSources]: GeoJSONSourceWithLayers<TSources[K]>;
};

/**
 * Per-source {@link CombinedEvents} surface keyed by the source name supplied in
 * {@link CustomGeoJSONModuleConfig.sources}.
 *
 * @group Custom
 */
export type CustomGeoJSONEvents<TSources extends Record<string, FeatureCollection>> = {
    [K in keyof TSources]: CombinedEvents<MapGeoJSONFeature, CustomGeoJSONModuleConfig<TSources>, TSources[K]>;
};

/**
 * Module for displaying customer-owned GeoJSON data with TomTom SDK support.
 *
 * Wraps one or more MapLibre GeoJSON sources together with caller-supplied layer specs,
 * and adds the usual TomTom SDK lifecycle behaviour on top: style-change restoration,
 * `config-change` / `shown-features` events, and per-source user interaction events
 * (`click`, `hover`, `long-hover`, `contextmenu`).
 *
 * Unlike opinionated modules such as {@link PlacesModule} or {@link GeometriesModule},
 * this module makes no assumptions about how data is rendered — the caller passes raw
 * MapLibre layer specs (`circle`, `heatmap`, `fill`, `line`, `symbol`, …).
 *
 * @typeParam TSources - A record mapping source names to the {@link FeatureCollection}
 * type each source carries. Pass this generic when you want type-safe `show` /
 * `getShown` per source.
 *
 * @example
 * Single source, default generic:
 * ```typescript
 * const module = await CustomGeoJSONModule.get(map, {
 *     sources: {
 *         points: {
 *             layers: [{ type: 'circle', paint: { 'circle-radius': 4, 'circle-color': '#0a3653' } }],
 *         },
 *     },
 * });
 *
 * await module.show(myFeatureCollection, 'points');
 * module.events.points.on('click', (feature, lngLat) => console.log(feature, lngLat));
 * ```
 *
 * @example
 * Multiple sources with typed payloads:
 * ```typescript
 * type Sources = {
 *     heatmap: FeatureCollection<Point>;
 *     buildings: FeatureCollection<Polygon, { name: string }>;
 * };
 *
 * const module = await CustomGeoJSONModule.get<Sources>(map, {
 *     sources: {
 *         heatmap: { layers: [{ type: 'heatmap', paint: { 'heatmap-radius': 12 } }] },
 *         buildings: { layers: [{ type: 'fill', paint: { 'fill-color': '#5a5' } }] },
 *     },
 * });
 *
 * await module.show(heatmapData, 'heatmap');
 * await module.show(buildingData, 'buildings');
 * ```
 *
 * @example
 * Same data, multiple renderings — call `show` once without a source name:
 * ```typescript
 * type Buildings = FeatureCollection<Point, { Name: string }>;
 *
 * const module = await CustomGeoJSONModule.get<{ heatmap: Buildings; markers: Buildings }>(map, {
 *     sources: {
 *         heatmap: { layers: heatmapLayers },
 *         markers: { layers: markerLayers },
 *     },
 * });
 *
 * await module.show(buildingData); // applied to both sources
 * ```
 *
 * @group Custom
 */
export class CustomGeoJSONModule<
    TSources extends Record<string, FeatureCollection> = Record<string, FeatureCollection>,
> extends AbstractMapModule<CustomGeoJSONSourcesWithLayers<TSources>, CustomGeoJSONModuleConfig<TSources>> {
    // Resolved (post-auto-gen) IDs and layer specs, indexed by source name.
    // Stable across style changes because they are derived deterministically from instanceIndex + config.
    private resolvedSourceIDs!: { [K in keyof TSources]: string };
    private resolvedLayerSpecs!: { [K in keyof TSources]: ToBeAddedLayerSpecWithoutSource[] };

    // Cached last-shown data per source so style-change restore can replay show() calls.
    // Lazy-initialised because the base-class constructor invokes _initSourcesWithLayers
    // before subclass field initialisers run.
    private lastShown!: Partial<{ [K in keyof TSources]: TSources[K] }>;

    // Per-source shown-features handler arrays. References are kept stable so that handlers
    // registered through one events getter call survive subsequent getter calls.
    // Lazy-initialised for the same reason as lastShown.
    private shownFeaturesHandlersBySource!: Map<keyof TSources, ((data: TSources[keyof TSources]) => void)[]>;

    /**
     * Creates a new {@link CustomGeoJSONModule} once the map is ready.
     *
     * @param tomtomMap The TomTomMap instance.
     * @param config Module configuration. `sources` is required and must contain at
     * least one entry; each entry must have at least one layer.
     */
    static async get<TSources extends Record<string, FeatureCollection> = Record<string, FeatureCollection>>(
        tomtomMap: TomTomMap,
        config: CustomGeoJSONModuleConfig<TSources>,
    ): Promise<CustomGeoJSONModule<TSources>> {
        await waitUntilMapIsReady(tomtomMap);
        validateConfig(config);
        return new CustomGeoJSONModule<TSources>(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config: CustomGeoJSONModuleConfig<TSources>) {
        super('geojson', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(
        config: CustomGeoJSONModuleConfig<TSources> | undefined,
        restore?: boolean,
    ): CustomGeoJSONSourcesWithLayers<TSources> {
        // config is required by the public API; AbstractMapModule's signature allows undefined.
        const effectiveConfig = config ?? (this.config as CustomGeoJSONModuleConfig<TSources>);
        if (!restore) {
            this.lastShown = {};
            this.shownFeaturesHandlersBySource = new Map();
        }
        this.resolveIDs(effectiveConfig);
        // Images must be registered BEFORE the GeoJSONSourceWithLayers instances are
        // created, so symbol layers referencing them via `icon-image: '<id>'` never
        // render against a missing image. This also covers the style-change restore
        // path because `_initSourcesWithLayers` is called both on init and on restore.
        this.registerImages(effectiveConfig);

        const sources = {} as CustomGeoJSONSourcesWithLayers<TSources>;
        for (const sourceName of Object.keys(effectiveConfig.sources) as Array<keyof TSources>) {
            const sourceID = this.resolvedSourceIDs[sourceName];
            const layerSpecs = this.resolvedLayerSpecs[sourceName];
            const cluster = effectiveConfig.sources[sourceName].cluster;
            sources[sourceName] = new GeoJSONSourceWithLayers<TSources[typeof sourceName]>(
                this.mapLibreMap,
                sourceID,
                layerSpecs,
                true,
                cluster,
            );

            if (!this.shownFeaturesHandlersBySource.has(sourceName)) {
                this.shownFeaturesHandlersBySource.set(sourceName, []);
            }
        }
        return sources;
    }

    private registerImages(config: CustomGeoJSONModuleConfig<TSources>): void {
        if (!config.images) return;

        for (const [imageID, spec] of Object.entries(config.images)) {
            if (this.mapLibreMap.hasImage(imageID)) continue;
            this.mapLibreMap.addImage(imageID, spec.image, spec.options);
        }
    }

    private resolveIDs(config: CustomGeoJSONModuleConfig<TSources>): void {
        const sourceIDs = {} as { [K in keyof TSources]: string };
        const layerSpecs = {} as { [K in keyof TSources]: ToBeAddedLayerSpecWithoutSource[] };
        for (const sourceName of Object.keys(config.sources) as Array<keyof TSources>) {
            const sourceSpec = config.sources[sourceName];
            const resolvedSourceID =
                sourceSpec.sourceID ?? `custom-geojson-${this.instanceIndex}-${String(sourceName)}`;
            sourceIDs[sourceName] = resolvedSourceID;
            layerSpecs[sourceName] = sourceSpec.layers.map(
                (layer, layerIndex) =>
                    ({
                        ...layer,
                        id: layer.id ?? `${resolvedSourceID}-layer-${layerIndex}`,
                    }) as ToBeAddedLayerSpecWithoutSource,
            );
        }
        this.resolvedSourceIDs = sourceIDs;
        this.resolvedLayerSpecs = layerSpecs;
    }

    /**
     * @ignore
     */
    protected _applyConfig(
        config: CustomGeoJSONModuleConfig<TSources> | undefined,
    ): CustomGeoJSONModuleConfig<TSources> | undefined {
        if (!config) {
            // Resetting the config to undefined is not supported — the module requires
            // a sources structure to remain operational. Keep the existing config.
            return this.config;
        }

        const previousConfig = this.config;
        const previousLayerSpecs = previousConfig ? this.resolvedLayerSpecs : undefined;
        this.resolveIDs(config);

        // Register any new images before layers are diffed in, so symbol layers added
        // by this applyConfig never render against a missing image. Additive only:
        // images already on the map are skipped; removing an entry from config.images
        // does not removeImage it (other layers or future show() data may still need it).
        this.registerImages(config);

        // On the very first apply (called by the base-class constructor right after
        // _initSourcesWithLayers), there's no previous layer set to diff against — the
        // layers were just added by _initSourcesWithLayers.
        if (previousConfig && previousLayerSpecs) {
            this.updateLayersForExistingSources(previousLayerSpecs);
        }

        if (config.visible !== undefined) {
            this.applyVisibility(config.visible);
        }

        return config;
    }

    private updateLayersForExistingSources(
        previousLayerSpecs: { [K in keyof TSources]: ToBeAddedLayerSpecWithoutSource[] },
    ): void {
        for (const sourceName of Object.keys(this.resolvedLayerSpecs) as Array<keyof TSources>) {
            const previous = previousLayerSpecs[sourceName];
            const next = this.resolvedLayerSpecs[sourceName];
            const sourceWithLayers = this.sourcesWithLayers[sourceName];
            if (!previous || !sourceWithLayers) continue;

            updateLayersAndSource(next, previous, sourceWithLayers, this.mapLibreMap);

            const layersToAdd: ToBeAddedLayerSpec[] = [];
            for (const layerSpec of sourceWithLayers._layerSpecs) {
                if (!this.mapLibreMap.getLayer(layerSpec.id)) {
                    layersToAdd.push(layerSpec);
                }
            }
            if (layersToAdd.length > 0) {
                addLayers(layersToAdd, this.mapLibreMap);
                // addLayers always adds with visibility 'none'. If the source already has
                // features shown, reveal the new layers to keep them in sync.
                if (sourceWithLayers.shownFeatures.features.length > 0) {
                    sourceWithLayers.setLayersVisible(true);
                }
            }
        }
    }

    private applyVisibility(visible: boolean): void {
        for (const sourceName of Object.keys(this.sourcesWithLayers) as Array<keyof TSources>) {
            this.sourcesWithLayers[sourceName].setLayersVisible(visible);
        }
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl(): void {
        const sourceNames = Object.keys(this.lastShown) as Array<keyof TSources>;
        this.initSourcesWithLayers(this.config, true);
        if (this.config) this._applyConfig(this.config);
        // Call showOnSource (sync) directly rather than show() (async) — the module is
        // already ready at this point so the waitUntilModuleReady() wrapper is a no-op,
        // and using the sync path keeps restore fully synchronous and avoids leaking
        // unhandled rejections if a shown-features handler throws.
        for (const sourceName of sourceNames) {
            const data = this.lastShown[sourceName];
            if (data) this.showOnSource(sourceName, data);
        }
    }

    /**
     * Displays the given GeoJSON data on the named source — or on every source when
     * no name is supplied.
     *
     * Replaces any previously shown data. Layer visibility is set automatically based
     * on whether the feature collection is non-empty.
     *
     * @param data The GeoJSON feature collection to display.
     * @param sourceName The source name (must match a key from
     * {@link CustomGeoJSONModuleConfig.sources}). When omitted, `data` is shown on
     * every source — best used when every source shares the same `FeatureCollection`
     * shape.
     */
    async show<K extends keyof TSources>(data: TSources[K], sourceName?: K): Promise<void> {
        await this.waitUntilModuleReady();
        if (sourceName === undefined) {
            for (const name of Object.keys(this.sourcesWithLayers) as Array<keyof TSources>) {
                this.showOnSource(name, data as TSources[typeof name]);
            }
            return;
        }
        this.showOnSource(sourceName, data);
    }

    private showOnSource<K extends keyof TSources>(sourceName: K, data: TSources[K]): void {
        const normalized = ensureFeatureIDs(data);
        this.lastShown[sourceName] = normalized;
        this.sourcesWithLayers[sourceName].show(normalized);
        const handlers = this.shownFeaturesHandlersBySource.get(sourceName);
        if (handlers) {
            for (const handler of handlers) {
                handler(normalized);
            }
        }
    }

    /**
     * Clears data from the given source — or from all sources when no name is supplied.
     */
    async clear(sourceName?: keyof TSources): Promise<void> {
        await this.waitUntilModuleReady();
        if (sourceName !== undefined) {
            this.sourcesWithLayers[sourceName].clear();
            delete this.lastShown[sourceName];
            return;
        }
        for (const name of Object.keys(this.sourcesWithLayers) as Array<keyof TSources>) {
            this.sourcesWithLayers[name].clear();
            delete this.lastShown[name];
        }
    }

    /**
     * Returns the feature collection currently shown on each source.
     *
     * Sources that have never been shown (or have been cleared) return the empty
     * feature collection that `GeoJSONSourceWithLayers` keeps as initial state.
     */
    getShown(): { [K in keyof TSources]: TSources[K] } {
        const result = {} as { [K in keyof TSources]: TSources[K] };
        for (const sourceName of Object.keys(this.sourcesWithLayers) as Array<keyof TSources>) {
            result[sourceName] = this.sourcesWithLayers[sourceName].shownFeatures;
        }
        return result;
    }

    /**
     * Toggles visibility of every layer across every source.
     *
     * @remarks
     * Calling {@link show} on a source after `setVisible(false)` will re-reveal that
     * source's layers via `GeoJSONSourceWithLayers`' automatic visibility behaviour.
     * To keep a source hidden, call `setVisible(false)` after the next `show`.
     */
    setVisible(visible: boolean): void {
        this.config = { ...(this.config as CustomGeoJSONModuleConfig<TSources>), visible };
        this.applyVisibility(visible);
        this.emitConfigChange();
    }

    /**
     * Per-source events surface.
     *
     * Each key on the returned object is one of the source names declared in
     * {@link CustomGeoJSONModuleConfig.sources}. Each value is a {@link CombinedEvents}
     * instance covering both user interactions (`click`, `hover`, `long-hover`,
     * `contextmenu`) and module lifecycle events (`config-change`, `shown-features`).
     *
     * `config-change` handlers are module-wide (the same handler array is shared
     * across every source's `CombinedEvents`). `shown-features` handlers fire only for
     * their own source.
     *
     * @example
     * ```typescript
     * module.events.buildings.on('click', (feature, lngLat) => { ... });
     * module.events.heatmap.on('shown-features', (data) => { ... });
     * module.events.buildings.on('config-change', (config) => { ... });
     * ```
     */
    get events(): CustomGeoJSONEvents<TSources> {
        const result = {} as CustomGeoJSONEvents<TSources>;
        for (const sourceName of Object.keys(this.sourcesWithLayers) as Array<keyof TSources>) {
            const sourceWithLayers = this.sourcesWithLayers[sourceName];
            const shownHandlers = this.shownFeaturesHandlersBySource.get(sourceName) ?? [];
            result[sourceName] = new CombinedEvents(
                new UserEvents<MapGeoJSONFeature>(this.eventsProxy, sourceWithLayers, this.config?.events),
                new ModuleEvents<CustomGeoJSONModuleConfig<TSources>, TSources[typeof sourceName]>(
                    this.configChangeHandlers,
                    shownHandlers as ((data: TSources[typeof sourceName]) => void)[],
                ),
            );
        }
        return result;
    }
}

const validateConfig = <TSources extends Record<string, FeatureCollection>>(
    config: CustomGeoJSONModuleConfig<TSources>,
): void => {
    if (!config.sources || Object.keys(config.sources).length === 0) {
        throw new Error('CustomGeoJSONModule requires at least one source in config.sources.');
    }
    for (const [sourceName, sourceSpec] of Object.entries(config.sources)) {
        if (!sourceSpec.layers || sourceSpec.layers.length === 0) {
            throw new Error(`CustomGeoJSONModule source "${sourceName}" requires at least one layer.`);
        }
    }
};

// Guarantees every feature has matching top-level `feature.id` and `properties.id`,
// generating an index-based ID when neither is set. This makes feature lookup reliable
// across both cluster mode (no `promoteId`, where MapLibre uses the top-level
// `feature.id`) and non-cluster mode (where `promoteId: 'id'` makes MapLibre treat
// `properties.id` as the feature id). Without it, features missing IDs collapse onto
// `feature.id === undefined` and event handlers can't distinguish between them.
const ensureFeatureIDs = <T extends FeatureCollection>(data: T): T => {
    let needsRewrite = false;
    for (const feature of data.features) {
        if (feature.id == null || feature.properties?.id !== feature.id) {
            needsRewrite = true;
            break;
        }
    }
    if (!needsRewrite) return data;
    return {
        ...data,
        features: data.features.map((feature, index) => {
            const id = feature.id ?? feature.properties?.id ?? index;
            return {
                ...feature,
                id,
                properties: { ...feature.properties, id },
            };
        }),
    } as T;
};
