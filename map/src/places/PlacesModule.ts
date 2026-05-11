import type { Place, Places } from '@tomtom-org/maps-sdk/core';
import type { LayerSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    GeoJSONSourceClusterOptions,
    PutEventStateOptions,
    ToBeAddedLayerSpecWithoutSource,
} from '../shared';
import {
    AbstractMapModule,
    CombinedEvents,
    GeoJSONSourceWithLayers,
    ModuleEvents,
    mapStyleLayerIDs,
    UserEvents,
} from '../shared';
import { DEFAULT_PLACE_ICON_ID } from '../shared/layers/symbolLayers';
import { suffixNumber } from '../shared/layers/utils';
import { addLayers, addOrUpdateImage, updateLayersAndSource, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { clusteredPlacesAggregateProperties } from './layers/clusterLayers';
import { buildConnectionLayerSpecs } from './layers/connectionsLayers';
import { buildPlacesLayerSpecs } from './layers/placesLayers';
import { defaultPin } from './resources';
import type { DisplayPlaceProps } from './types/placeDisplayProps';
import {
    PlaceConnectionDisplay,
    PlaceIconConfig,
    PlaceLayerName,
    PlacesModuleConfig,
    PlacesTheme,
    PlaceTextConfig,
} from './types/placesModuleConfig';
import type { ConnectionFeatureCollection } from './utils/prepareConnectionsForDisplay';
import { prepareConnectionsForDisplay } from './utils/prepareConnectionsForDisplay';
import { preparePlacesForDisplay } from './utils/preparePlacesForDisplay';

type PlacesSourcesAndLayers = {
    /**
     * Places source id with corresponding layers ids. Carries every layer the
     * module owns under non-clustered themes; under `pin-clustered` it carries
     * everything except `micro` and is configured with `cluster: true` so the
     * pin / cluster pin / cluster-badge / cluster-count / mixed-cluster
     * badge + count layers all see aggregated cluster features.
     */
    places: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>;
    /**
     * Companion source — only created under `pin-clustered`. Feeds the `micro`
     * layer with the same place features but **without** clustering, so the
     * tiny base-map-style POI dots render on every place individually
     * regardless of how the larger pins above them get aggregated.
     */
    placesUnclustered?: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>;
    /**
     * Connections source id with corresponding layers ids (line + label).
     */
    connections: GeoJSONSourceWithLayers<ConnectionFeatureCollection>;
};

type ConnectionLayerSpecMap = {
    line: ToBeAddedLayerSpecWithoutSource<LineLayerSpecification>;
    label: ToBeAddedLayerSpecWithoutSource<SymbolLayerSpecification>;
};

/**
 * Map module for displaying and managing place markers.
 *
 * The PlacesModule provides functionality to display location markers (pins) on the map
 * for points of interest, search results, or custom locations. It supports various marker
 * styles, custom icons, text labels, and interactive events.
 *
 * @remarks
 * **Features:**
 * - Multiple marker styles (pin, circle-icon, base-map POI-like)
 * - Custom icons per POI category
 * - Text labels with styling options
 * - Data-driven styling via MapLibre expressions
 * - Interactive events (click, hover, etc.)
 * - Support for custom feature properties
 * - EV charging station availability display (opt-in)
 *
 * **Marker Styles:**
 * - `pin`: Traditional teardrop-shaped map pins
 * - `circle-icon`: Simple circular markers (previously named `circle`)
 * - `base-map`: Mimics the map's built-in POI layer styling (combines `main`, `selected`, and `micro` layers). For micro-only rendering, hide the `main` layer via `layers.main.layout.visibility = 'none'`.
 *
 * **EV Charging Station Availability:**
 * When displaying EV charging stations with availability data from
 * {@link getPlacesWithEVAvailability}, the module can:
 * - Show available/total charging points (e.g., "3/10")
 * - Color-code availability (green = good, orange = limited, red = none/low)
 * - Display as formatted text within the station's label
 *
 * This feature is disabled by default. To enable it, set `evAvailability.enabled` to `true`
 * in the configuration.
 *
 * **Common Use Cases:**
 * - Search result visualization
 * - Custom location markers
 * - Store locators
 * - EV charging station maps with real-time availability
 * - Delivery/pickup points
 * - Saved locations display
 *
 * @example
 * ```typescript
 * // Create places module with pin markers
 * const placesModule = await PlacesModule.get(map, {
 *   icon: {
 *     categoryIcons: []
 *   },
 *   text: {
 *     field: (place) => place.properties.poi?.name || 'Unknown'
 *   },
 *   theme: 'pin'
 * });
 *
 * // Display places from search
 * await placesModule.show(searchResults);
 *
 * // EV Charging Stations - Opt-in to availability display
 * const evStations = await PlacesModule.get(map, {
 *   evAvailability: { enabled: true }
 * });
 * const results = await search({ poiCategories: ['ELECTRIC_VEHICLE_STATION'] });
 * evStations.show(await getPlacesWithEVAvailability(results)); // Shows availability
 *
 * // Granular control: Enable for searched stations only, background stations without
 * const bgStations = await PlacesModule.get(map); // EV availability disabled
 * const searched = await PlacesModule.get(map, {
 *   evAvailability: { enabled: true }
 * });
 *
 * // Handle clicks
 * placesModule.events.on('click', (feature) => {
 *   console.log('Clicked:', feature.properties);
 * });
 *
 * placesModule.events.on('hover', (feature) => {
 *   showTooltip(feature.properties.poi?.name);
 * });
 * ```
 *
 * @see [Places Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/places)
 *
 * @group Places
 */
// Default radius (in pixels) used by MapLibre when clustering pins for the
// `pin-clustered` theme. Tuned to the default pin sprite footprint so that
// adjacent pins are visually merged but cities/blocks aren't collapsed into
// a single cluster.
const DEFAULT_CLUSTER_RADIUS_PX = 60;

export class PlacesModule extends AbstractMapModule<PlacesSourcesAndLayers, PlacesModuleConfig> {
    private static lastInstanceIndex = -1;
    // Cluster layers (`clusterBadge` in particular) aren't symbol layers, so the
    // record value is widened to the full layer-spec union.
    private layerSpecs!: Record<PlaceLayerName, ToBeAddedLayerSpecWithoutSource<LayerSpecification>>;
    private connectionLayerSpecs!: ConnectionLayerSpecMap;
    // Tracks the cluster mode reflected in the currently-mounted source. Used to
    // detect cluster mode toggles in `updateLayersAndData` so we can rebuild the
    // source (MapLibre fixes `cluster` at source-creation time).
    private currentClusterMode = false;
    private sourceID!: string;
    // Companion source id used by the `pin-clustered` theme to back the
    // un-clustered `micro` layer. Allocated alongside `sourceID` on first init
    // so it stays stable across rebuilds.
    private unclusteredSourceID!: string;
    private connectionSourceID!: string;
    private layerIDPrefix!: string;
    /**
     * The index of this instance, to generate unique source and layer IDs.
     * * Starts with 0 and each instance increments it by one.
     * @private
     */
    private instanceIndex!: number;
    private defaultPlaceIconID!: string;
    // Assigned in `_initSourcesWithLayers` (which runs before `_applyConfig` during the
    // base-class constructor). A class-field initializer would be too late: it runs
    // after `super()`, by which point `_applyConfig` has already read this field.
    private shownConnections!: PlaceConnectionDisplay[];
    private readonly shownFeaturesHandlers: ((features: Place | Place[] | Places) => void)[] = [];

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: PlacesModuleConfig): Promise<PlacesModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new PlacesModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: PlacesModuleConfig) {
        super('geojson', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: PlacesModuleConfig, restore?: boolean): PlacesSourcesAndLayers {
        // Only increment the instance index for new instances, not for restore operations
        if (!restore) {
            PlacesModule.lastInstanceIndex++;
            this.instanceIndex = PlacesModule.lastInstanceIndex;
            this.sourceID = `places-${this.instanceIndex}`;
            this.unclusteredSourceID = `places-${this.instanceIndex}-unclustered`;
            this.connectionSourceID = `places-connections-${this.instanceIndex}`;
            this.layerIDPrefix = this.sourceID;
            this.defaultPlaceIconID = suffixNumber(DEFAULT_PLACE_ICON_ID, this.instanceIndex);
            this.shownConnections = [];
        }

        // Update each layer id with the instance-specific prefix
        this.layerSpecs = this.buildLayerSpecs(config);

        const clusterOptions = this.buildClusterOptions(config);
        this.currentClusterMode = clusterOptions?.cluster === true;

        // Under `pin-clustered` we split the layer specs across two sources:
        //   - clustered (`places`): every layer that needs aggregated cluster
        //     features (main pin, selected, cluster pin, cluster badge,
        //     cluster count, mixed-cluster badge, mixed-cluster count)
        //   - unclustered (`placesUnclustered`): just `micro`, so the small
        //     base-map-style POI dots render per place even when the bigger
        //     pins above them collapse into clusters
        // For all other themes there's only one source; the second one stays
        // `undefined` to keep the surface area minimal.
        const splitSpecs = this.partitionSpecsForSources(this.layerSpecs);

        // Defer the built-in layer add (`false`) — our specs use `beforeID` stacking
        // (`micro` → `main` → `selected` → `cluster` → `clusterBadge` →
        // `clusterCount` → `clusterMixedBadge` → `clusterMixedCount`)
        // which `ensureLayersAddedToMap` can't resolve topologically. `addLayers` walks
        // the dependency order instead; running it at init keeps the layers on the map
        // before `updateLayersAndSource` touches them.
        const places = new GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>(
            this.mapLibreMap,
            this.sourceID,
            splitSpecs.clusteredSpecs,
            false,
            clusterOptions,
        );

        let placesUnclustered: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>> | undefined;
        if (splitSpecs.unclusteredSpecs.length > 0) {
            placesUnclustered = new GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>(
                this.mapLibreMap,
                this.unclusteredSourceID,
                splitSpecs.unclusteredSpecs,
                false,
            );
        }

        // Both source's layers must be on the map before `addLayers` resolves
        // any cross-spec `beforeID` dependencies. The combined list is what
        // existing layers (`cluster`, the row, etc.) anchor against, so feed
        // them in together.
        addLayers([...places._layerSpecs, ...(placesUnclustered?._layerSpecs ?? [])], this.mapLibreMap);

        // Connections are added after places so that their `beforeID` anchor (the
        // places `main` layer) already exists on the map — MapLibre then inserts
        // connection layers below places, keeping pins visible on top of the lines.
        this.connectionLayerSpecs = this.buildConnectionLayerSpecs(config);
        const connections = new GeoJSONSourceWithLayers<ConnectionFeatureCollection>(
            this.mapLibreMap,
            this.connectionSourceID,
            Object.values(this.connectionLayerSpecs),
            false,
        );
        addLayers(connections._layerSpecs, this.mapLibreMap);

        // Only include `placesUnclustered` when it actually exists — the base
        // class iterates every entry to derive `sourceAndLayerIDs`, so an
        // undefined value would crash on themes that don't use the companion.
        return placesUnclustered ? { places, placesUnclustered, connections } : { places, connections };
    }

    // Splits the per-name layer specs into the clustered and unclustered
    // buckets. Under `pin-clustered` the `micro` slot belongs to the
    // unclustered bucket so its base-map-style sprites render per leaf
    // regardless of how the cluster aggregator collapses points; every other
    // theme leaves the unclustered bucket empty (single-source mode).
    private partitionSpecsForSources(
        layerSpecs: Record<PlaceLayerName, ToBeAddedLayerSpecWithoutSource<LayerSpecification>>,
    ): {
        clusteredSpecs: ToBeAddedLayerSpecWithoutSource<LayerSpecification>[];
        unclusteredSpecs: ToBeAddedLayerSpecWithoutSource<LayerSpecification>[];
    } {
        if (!this.currentClusterMode) {
            return { clusteredSpecs: Object.values(layerSpecs), unclusteredSpecs: [] };
        }
        const unclusteredSpecs: ToBeAddedLayerSpecWithoutSource<LayerSpecification>[] = [];
        const clusteredSpecs: ToBeAddedLayerSpecWithoutSource<LayerSpecification>[] = [];
        for (const [name, spec] of Object.entries(layerSpecs)) {
            if (name === 'micro') unclusteredSpecs.push(spec);
            else clusteredSpecs.push(spec);
        }
        return { clusteredSpecs, unclusteredSpecs };
    }

    private buildLayerSpecs(
        config?: PlacesModuleConfig,
    ): Record<PlaceLayerName, ToBeAddedLayerSpecWithoutSource<LayerSpecification>> {
        const layerSpecTemplates = buildPlacesLayerSpecs(
            config,
            this.tomtomMap.mapLibreMap,
            this.tomtomMap.styleLightDarkTheme,
            this.instanceIndex,
        );
        const internalNames = new Set(Object.keys(layerSpecTemplates));

        // Rewrite internal layer IDs and any `beforeID` that refers to another
        // internal layer (e.g., `main`, `selected`) into instance-scoped IDs.
        return Object.fromEntries(
            Object.entries(layerSpecTemplates).map(([key, spec]) => {
                const beforeID = (spec as { beforeID?: string }).beforeID;
                return [
                    key,
                    {
                        ...spec,
                        id: `${this.layerIDPrefix}-${key}`,
                        ...(beforeID && internalNames.has(beforeID)
                            ? { beforeID: `${this.layerIDPrefix}-${beforeID}` }
                            : {}),
                    },
                ];
            }),
        ) as Record<PlaceLayerName, ToBeAddedLayerSpecWithoutSource<LayerSpecification>>;
    }

    // Returns the cluster options to apply on the GeoJSON source for the given
    // theme, or `undefined` to leave clustering off entirely. Only the
    // `pin-clustered` theme opts in.
    private buildClusterOptions(config?: PlacesModuleConfig): GeoJSONSourceClusterOptions | undefined {
        if (config?.theme !== 'pin-clustered') return undefined;
        return {
            cluster: true,
            clusterRadius: DEFAULT_CLUSTER_RADIUS_PX,
            clusterProperties: clusteredPlacesAggregateProperties,
        };
    }

    private buildConnectionLayerSpecs(config?: PlacesModuleConfig): ConnectionLayerSpecMap {
        const specs = buildConnectionLayerSpecs(config?.connections);
        const lineID = `${this.layerIDPrefix}-connection-line`;
        const labelID = `${this.layerIDPrefix}-connection-label`;
        // Stack connections under the base-map label layer (`lowestLabel`) so city /
        // street labels and place pins all render on top. `addLayers` resolves
        // `beforeID` in dependency order; two layers sharing the same anchor end up
        // stacked in insertion order (line first → label on top).
        const anchor = mapStyleLayerIDs.lowestLabel;
        return {
            line: { ...specs.line, id: lineID, beforeID: anchor },
            label: { ...specs.label, id: labelID, beforeID: anchor },
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: PlacesModuleConfig | undefined) {
        this.updateLayersAndData(config);
        return config;
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousShownFeatures = this.sourcesWithLayers.places.shownFeatures;
        const previousConnections = this.shownConnections;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
        if (previousConnections.length) {
            this.showConnections(previousConnections);
        }
    }

    /**
     * Updates the visual theme for displayed places.
     *
     * @param theme - The theme style to apply to place markers.
     *
     * @remarks
     * **Available Themes:**
     * - `pin`: Traditional teardrop-shaped map pins
     * - `circle-icon`: Simple circular markers (previously named `circle`)
     * - `base-map`: Mimics the map's built-in POI layer style with category icons (combines `main`, `selected`, and `micro`). For micro-only rendering, hide the `main` layer via `layers.main.layout.visibility = 'none'`.
     *
     * Changes apply immediately to all currently shown places. Other configuration
     * properties (icon config, text config) remain unchanged.
     *
     * @example
     * ```typescript
     * // Switch to pin markers
     * placesModule.applyTheme('pin');
     *
     * // Use simple circles
     * placesModule.applyTheme('circle-icon');
     *
     * // Match map's POI style (ideal to blend in)
     * placesModule.applyTheme('base-map');
     * ```
     */
    applyTheme(theme: PlacesTheme): void {
        this.applyConfigPart({ theme });
    }

    /**
     * Updates the icon configuration for displayed places.
     *
     * @param iconConfig - New icon configuration settings.
     *
     * @remarks
     * - Changes apply immediately to currently shown places
     * - Custom icons are loaded if not already in style
     * - Other configuration properties remain unchanged
     *
     * @example
     * ```typescript
     * placesModule.applyIconConfig({
     *   categoryIcons: [
     *     { category: 'RESTAURANT', id: 'restaurant-icon', image: '/icons/food.png' }
     *   ]
     * });
     * ```
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        this.applyConfigPart({ icon: iconConfig });
    }

    /**
     * Updates the text/label configuration for displayed places.
     *
     * @param textConfig - New text configuration settings.
     *
     * @remarks
     * Supports both functions and MapLibre expressions for dynamic text.
     *
     * @example
     * ```typescript
     * // Use function
     * placesModule.applyTextConfig({
     *   field: (place) => place.properties.poi?.name || 'Unknown'
     * });
     *
     * // Use MapLibre expression
     * placesModule.applyTextConfig({
     *   field: ['get', 'title'],
     *   size: 14,
     *   color: '#333'
     * });
     * ```
     */
    applyTextConfig(textConfig: PlaceTextConfig): void {
        this.applyConfigPart({ text: textConfig });
    }

    private applyConfigPart(partialConfig: Partial<PlacesModuleConfig>): void {
        const config = { ...this.config, ...partialConfig };
        this.updateLayersAndData(config);
        this.config = config;
        this.emitConfigChange();
    }

    /**
     * Applies additional feature properties to displayed places.
     *
     * @param extraFeatureProps - Object mapping property names to values or functions.
     *
     * @remarks
     * Useful for adding computed properties or metadata for styling/filtering.
     *
     * @example
     * ```typescript
     * placesModule.applyExtraFeatureProps({
     *   category: (place) => place.properties.poi?.localizedCategories?.[0],
     *   rating: (place) => place.properties.poi?.rating || 0,
     *   isOpen: true
     * });
     * ```
     */
    applyExtraFeatureProps(extraFeatureProps: { [key: string]: any }): void {
        const config = { ...this.config, extraFeatureProps };
        this.updateData(config);
        this.config = config;
        this.emitConfigChange();
    }

    private updateLayersAndData(config: PlacesModuleConfig | undefined): void {
        this.setupImages(config);

        // Toggling clustering on/off requires recreating the GeoJSON source — MapLibre
        // fixes the `cluster` flag at source-creation time. The fast `updateLayersAndSource`
        // path can't help here, so we tear the module down and rebuild it from scratch via
        // the same flow used for style restorations.
        const nextClusterMode = this.buildClusterOptions(config)?.cluster === true;
        if (nextClusterMode !== this.currentClusterMode) {
            this.rebuildSourcesAndLayers(config);
            return;
        }

        const newLayerSpecs = this.buildLayerSpecs(config);
        // The two-source pin-clustered layout means specs per source can no
        // longer change in lock-step here: a layer's `source` is fixed at add
        // time, and partitioning re-evaluates it. Within a single cluster
        // mode the assignment is stable (clustered: everything-but-micro;
        // unclustered: micro), so we can update each source's specs in place.
        const newSplit = this.currentClusterMode
            ? this.partitionSpecsForSources(newLayerSpecs)
            : { clusteredSpecs: Object.values(newLayerSpecs), unclusteredSpecs: [] };
        const oldSplit = this.currentClusterMode
            ? this.partitionSpecsForSources(this.layerSpecs)
            : { clusteredSpecs: Object.values(this.layerSpecs), unclusteredSpecs: [] };
        updateLayersAndSource(
            newSplit.clusteredSpecs,
            oldSplit.clusteredSpecs,
            this.sourcesWithLayers.places,
            this.mapLibreMap,
        );
        if (this.sourcesWithLayers.placesUnclustered && newSplit.unclusteredSpecs.length > 0) {
            updateLayersAndSource(
                newSplit.unclusteredSpecs,
                oldSplit.unclusteredSpecs,
                this.sourcesWithLayers.placesUnclustered,
                this.mapLibreMap,
            );
        }
        this.layerSpecs = newLayerSpecs;
        this.applyPlacesVisibility();
        this.updateData(config);
        this.updateConnectionLayersAndData(config);
    }

    // Rebuilds the underlying source + layers when the cluster flag changes.
    // Mirrors `restoreDataAndConfigImpl` (used on style reload) but without the
    // recursive `_applyConfig` call — the caller is *already* applying config.
    private rebuildSourcesAndLayers(config: PlacesModuleConfig | undefined): void {
        const previousShownFeatures = this.sourcesWithLayers.places.shownFeatures;
        const previousConnections = this.shownConnections;
        for (const spec of Object.values(this.layerSpecs)) {
            if (this.mapLibreMap.getLayer(spec.id)) this.mapLibreMap.removeLayer(spec.id);
        }
        for (const spec of Object.values(this.connectionLayerSpecs)) {
            if (this.mapLibreMap.getLayer(spec.id)) this.mapLibreMap.removeLayer(spec.id);
        }
        if (this.mapLibreMap.getSource(this.sourceID)) this.mapLibreMap.removeSource(this.sourceID);
        // The unclustered companion only exists under `pin-clustered`; on
        // teardown we always check before removing so leaving and re-entering
        // the theme doesn't leave a stale source on the map.
        if (this.mapLibreMap.getSource(this.unclusteredSourceID)) {
            this.mapLibreMap.removeSource(this.unclusteredSourceID);
        }
        if (this.mapLibreMap.getSource(this.connectionSourceID)) this.mapLibreMap.removeSource(this.connectionSourceID);

        this.initSourcesWithLayers(config, true);
        this.setupImages(config);
        const prepared = preparePlacesForDisplay(previousShownFeatures, this.instanceIndex, config);
        // Opt out of `setLayersVisible` inside `show` — it would mark every
        // layer in the source as visible, defeating the spec-level
        // `visibility: 'none'` we use to keep theme-hidden cluster slots
        // (badge / count / mixed badge / mixed count) from leaking onto
        // themes that don't cluster. `applyPlacesVisibility` runs after and
        // honours those flags.
        this.sourcesWithLayers.places.show(prepared, { automaticVisibility: false });
        this.sourcesWithLayers.placesUnclustered?.show(prepared, { automaticVisibility: false });
        this.applyPlacesVisibility();
        if (previousConnections.length) {
            this.shownConnections = [...previousConnections];
            this.updateConnectionsData(config);
        }
    }

    private updateConnectionLayersAndData(config: PlacesModuleConfig | undefined): void {
        const newSpecs = this.buildConnectionLayerSpecs(config);
        const connectionsSource = this.sourcesWithLayers.connections;
        updateLayersAndSource(
            Object.values(newSpecs),
            Object.values(this.connectionLayerSpecs),
            connectionsSource,
            this.mapLibreMap,
        );
        this.connectionLayerSpecs = newSpecs;
        this.updateConnectionsData(config);
    }

    private updateConnectionsData(config: PlacesModuleConfig | undefined): void {
        const shownPlaces = this.sourcesWithLayers.places.shownFeatures;
        this.sourcesWithLayers.connections.show(
            prepareConnectionsForDisplay(this.shownConnections, shownPlaces, config),
        );
    }

    // Data-driven "visible iff any features" — but skip specs carrying
    // `visibility: 'none'` so theme-hidden slots (e.g., `micro` on pin/circle-icon) and
    // caller-hidden layers (via `layers.*`) stay hidden. We iterate `this.layerSpecs`
    // rather than `placesSource._layerSpecs` because the latter is stale for updated
    // layers after a theme switch.
    //
    // The two-source split under `pin-clustered` doesn't change the visibility
    // contract: every layer's id still appears in `this.layerSpecs`, so a
    // single sweep here flips visibility correctly across both sources.
    private applyPlacesVisibility(): void {
        const hasData = !!this.sourcesWithLayers.places.shownFeatures.features.length;
        const visibility = hasData ? 'visible' : 'none';
        for (const spec of Object.values(this.layerSpecs)) {
            if (spec.layout?.visibility === 'none') {
                continue;
            }
            this.mapLibreMap.setLayoutProperty(spec.id, 'visibility', visibility, { validate: false });
        }
    }

    private setupImages(config: PlacesModuleConfig | undefined): void {
        // Ensure default pin is added:
        if (config?.icon) {
            // If we have custom icons, ensure they're added to the map style:
            for (const customIcon of config.icon.categoryIcons ?? []) {
                // Create unique ID for each custom icon, including availability level if present
                const iconID = customIcon.availabilityLevel
                    ? `${customIcon.id}-${customIcon.availabilityLevel}`
                    : customIcon.id;

                addOrUpdateImage(
                    'if-not-in-sprite',
                    suffixNumber(iconID, this.instanceIndex),
                    customIcon.image as string | HTMLImageElement,
                    this.mapLibreMap,
                    {
                        pixelRatio: customIcon.pixelRatio ?? 2,
                    },
                );
            }

            if (config.icon.default) {
                if (config.icon.default.image) {
                    addOrUpdateImage(
                        'if-not-in-sprite',
                        this.defaultPlaceIconID,
                        config.icon.default.image.image as string | HTMLImageElement,
                        this.mapLibreMap,
                        {
                            pixelRatio: config.icon.default.image.pixelRatio ?? 2,
                        },
                    );
                }
                if (config.icon.default.style) {
                    addOrUpdateImage(
                        'if-not-in-sprite',
                        this.defaultPlaceIconID,
                        defaultPin(config.icon.default.style),
                        this.mapLibreMap,
                        { pixelRatio: 2 },
                    );
                }
            }
        } else {
            // Ensure default pin is added:
            addOrUpdateImage('if-not-in-sprite', this.defaultPlaceIconID, defaultPin(), this.mapLibreMap, {
                pixelRatio: 2,
            });
        }
    }

    private updateData(config: PlacesModuleConfig | undefined): void {
        const prepared = preparePlacesForDisplay(
            this.sourcesWithLayers.places.shownFeatures,
            this.instanceIndex,
            config,
        );
        this.sourcesWithLayers.places.source.runtimeSource?.setData(prepared);
        // Mirror the same data into the unclustered companion (if any) so the
        // micro layer stays in sync with the rest of the module.
        this.sourcesWithLayers.placesUnclustered?.source.runtimeSource?.setData(prepared);
    }

    /**
     * Displays the given places on the map.
     *
     * @param places - Place data to display. Can be a single Place, array of Places,
     * or a Places FeatureCollection.
     *
     * @remarks
     * **Behavior:**
     * - Replaces any previously shown places
     * - Applies current module styling configuration
     * - Automatically generates labels if text config is set
     * - Waits for module to be ready before displaying
     *
     * **Data Sources:**
     * - TomTom Search API results
     * - Custom place objects matching the Place interface
     * - GeoJSON Point features
     *
     * @example
     * Display search results:
     * ```typescript
     * import { search } from '@tomtom-international/maps-sdk-js/services';
     *
     * const results = await search({ query: 'coffee' });
     * await placesModule.show(results);
     * ```
     *
     * @example
     * Display single place:
     * ```typescript
     * await placesModule.show({
     *   type: 'Feature',
     *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
     *   properties: {
     *     address: { freeformAddress: 'Amsterdam' },
     *     poi: { name: 'Amsterdam Central' }
     *   }
     * });
     * ```
     *
     * @example
     * Display multiple places:
     * ```typescript
     * await placesModule.show([place1, place2, place3]);
     * ```
     */
    async show(places: Place | Place[] | Places) {
        await this.waitUntilModuleReady();
        // Calling `show` swaps the underlying place set, which invalidates any
        // previously-shown connections (their endpoints may no longer exist). Clear
        // them before showing new places so stale lines don't linger.
        this.clearConnectionsSync();
        const prepared = preparePlacesForDisplay(places, this.instanceIndex, this.config);
        // Opt out of the blanket visibility flip — `applyPlacesVisibility` honors
        // spec-level `visibility: 'none'` so theme-hidden layers stay hidden.
        this.sourcesWithLayers.places.show(prepared, { automaticVisibility: false });
        // Mirror into the unclustered companion (only present under
        // `pin-clustered`) so the `micro` layer renders the same place set.
        this.sourcesWithLayers.placesUnclustered?.show(prepared, { automaticVisibility: false });
        this.applyPlacesVisibility();
        for (const handler of this.shownFeaturesHandlers) {
            handler(places);
        }
    }

    /**
     * Removes all places from the map.
     *
     * @remarks
     * - Clears all displayed places
     * - Does not reset styling configuration
     * - Module remains initialized and ready for new data
     *
     * @example
     * ```typescript
     * await placesModule.clear();
     * ```
     */
    async clear() {
        await this.waitUntilModuleReady();
        this.clearConnectionsSync();
        this.sourcesWithLayers.places.clear();
        this.sourcesWithLayers.placesUnclustered?.clear();
    }

    /**
     * Displays connection lines between pairs of places on the map.
     *
     * @param connections - List of connections to render. Each connection has a `from`
     * and `to` endpoint, expressed either as a {@link Place} or as the id of a place
     * currently shown by this module.
     *
     * @remarks
     * **Behavior:**
     * - Replaces any previously shown connections
     * - Connections whose id reference cannot be resolved against the currently shown
     *   places are silently skipped
     * - When {@link PlaceConnectionsConfig.label} is set on the module config, the
     *   returned string is rendered as a label along each line, slightly offset to
     *   the side. Without a label function, no label is shown.
     * - Calling `show()` or `clear()` pre-clears connections, since their endpoints
     *   may no longer be on the map.
     *
     * @example
     * ```typescript
     * const places = await PlacesModule.get(map, {
     *   connections: {
     *     label: (c) => `${c.distanceMeters} m`
     *   }
     * });
     * await places.show([station, ...cafes]);
     * await places.showConnections(
     *   cafes.features.map((cafe) => ({
     *     from: station.id,
     *     to: cafe.id,
     *     distanceMeters: Math.round(cafe.properties.dist ?? 0),
     *   })),
     * );
     * ```
     */
    async showConnections(connections: PlaceConnectionDisplay[]) {
        await this.waitUntilModuleReady();
        this.shownConnections = [...connections];
        this.updateConnectionsData(this.config);
    }

    /**
     * Removes all connection lines from the map, leaving displayed places intact.
     *
     * @example
     * ```typescript
     * await placesModule.clearConnections();
     * ```
     */
    async clearConnections() {
        await this.waitUntilModuleReady();
        this.clearConnectionsSync();
    }

    private clearConnectionsSync(): void {
        this.shownConnections = [];
        this.sourcesWithLayers.connections?.clear();
    }

    /**
     * Returns the currently shown places.
     *
     * @returns The places currently displayed on the map.
     *
     * @remarks
     * Returns the exact data that was passed to the `show()` method.
     *
     * @example
     * ```typescript
     * const shown = placesModule.getShown();
     * console.log(`Showing ${shown.places.features.length} places`);
     * ```
     */
    getShown() {
        return {
            places: this.sourcesWithLayers.places.shownFeatures,
            connections: [...this.shownConnections],
        };
    }

    /**
     * Programmatically sets an event state on a specific place.
     *
     * @param options - Configuration for the event state to apply.
     *
     * @remarks
     * Use this to make places appear clicked or hovered programmatically.
     *
     * @example
     * ```typescript
     * // Make first place appear clicked
     * placesModule.putEventState({
     *   index: 0,
     *   state: 'click',
     *   mode: 'put'
     * });
     * ```
     */
    putEventState(options: PutEventStateOptions) {
        this.sourcesWithLayers.places.putEventState(options);
    }

    /**
     * Removes an event state from a specific place.
     *
     * @param options - Configuration for which event state to remove.
     *
     * @example
     * ```typescript
     * placesModule.cleanEventState({ index: 0 });
     * ```
     */
    cleanEventState(options: CleanEventStateOptions): void {
        this.sourcesWithLayers.places.cleanEventState(options);
    }

    /**
     * Removes event states from multiple places.
     *
     * @param options - Optional filter for which states to remove.
     *
     * @example
     * ```typescript
     * // Remove all event states
     * placesModule.cleanEventStates();
     *
     * // Remove only hover states
     * placesModule.cleanEventStates({ states: ['hover'] });
     * ```
     */
    cleanEventStates(options?: CleanEventStatesOptions) {
        this.sourcesWithLayers.places.cleanEventStates(options);
    }

    get events(): CombinedEvents<Place<DisplayPlaceProps>, PlacesModuleConfig, Place | Place[] | Places> {
        return new CombinedEvents(
            new UserEvents<Place<DisplayPlaceProps>>(
                this.eventsProxy,
                this.sourcesWithLayers.places,
                this.config?.events,
            ),
            new ModuleEvents(this.configChangeHandlers, this.shownFeaturesHandlers),
        );
    }
}
