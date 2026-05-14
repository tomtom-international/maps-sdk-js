import type { TrafficIncident, TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { BeforeLayerConfig } from '../shared';
import {
    AbstractMapModule,
    CombinedEvents,
    GeoJSONSourceWithLayers,
    ModuleEvents,
    mapStyleLayerIDs,
    UserEvents,
} from '../shared';
import { addOrUpdateImage, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import {
    buildCanonicalIncidentLineLayers,
    buildCanonicalIncidentSymbolLayers,
    resolveFocusStyle,
} from './layers/incidentDetailsLayers';
import type { TrafficIncidentOverlayConfig } from './types/trafficIncidentOverlayConfig';
import { getIncidentDirectionChevronImage, INCIDENT_DIRECTION_CHEVRON_IMAGE_ID } from './util/incidentDirectionChevron';
import { readIncidentPalette } from './util/readIncidentPalette';

type Sources = {
    incidents: GeoJSONSourceWithLayers<TrafficIncidentDetails>;
};

// Resolve a caller-supplied `beforeLayerConfig` value into a concrete MapLibre layer-ID.
// Undefined (no config) places incidents below `lowestLabel` so labels stay readable on top;
// `'top'` passes undefined to MapLibre so layers go to the end of the stack. Mirrors
// `resolveBeforeID` in `traffic/layers/areaAnalyticsLayers.ts` for consistency.
const resolveBeforeID = (beforeLayerConfig?: BeforeLayerConfig): string | undefined => {
    if (beforeLayerConfig === 'top') return undefined;
    if (beforeLayerConfig) return mapStyleLayerIDs[beforeLayerConfig];
    return mapStyleLayerIDs.lowestLabel;
};

/**
 * Renders traffic incidents returned by `trafficIncidentDetails()` on the map.
 *
 * Use this module when you fetch incidents via the Incident Details service and want
 * to display them as a developer-controlled overlay. {@link TrafficIncidentsModule} is
 * the vector-tile alternative — hidden in the default style, so the overlay renders
 * on its own without collision; if you've enabled it elsewhere in your app, hide it
 * again before using the overlay to avoid double-rendering.
 *
 * ## Rendering approach
 *
 * 7–8 layers — 4 to 5 line (optional focus-halo, outline, solid inner, direction chevron,
 * pattern inner) and 3 symbol (incident marker, jam marker with delay text, closed-road
 * marker). Per-magnitude styling uses match expressions on `magnitudeOfDelay` inside a
 * single layer instead of one layer per magnitude. Colours are read from the loaded style
 * at init (see {@link ./util/readIncidentPalette}), falling back to built-in defaults when
 * absent. Direction is rendered as a tiled `line-pattern` (chevron sprite registered at
 * init) instead of the vector-tile module's per-feature `roads-arrow` symbol — the
 * pattern is continuous, so it reads on short jams and at planning zooms (z12+) where
 * the per-feature symbol only activates at z15+.
 *
 * ## Focus
 *
 * {@link setFocus} writes MapLibre feature-state `focused=true|false` on each rendered
 * incident. The default visual treatment widens the focused subset and paints a black
 * outline beneath it; unfocused incidents are unchanged. Override or disable the visual
 * treatment via the `focus` config — `focus: false` keeps `setFocus` writing feature-state
 * but emits no halo layer and no width pop, leaving callers free to drive their own
 * styling off `feature-state.focused`.
 *
 * ## API limitations
 *
 * The Incident Details REST API returns a feature list, not a rendering-ready tile.
 * Several tags that the vector-tile pipeline injects per-feature are absent:
 *
 *  - **Road classification** (`road_category`, `road_subcategory`) — the vector-tile
 *    pipeline scales line width and offset by road class (motorway wider than street,
 *    stripe placed alongside the road on one carriageway). Without it, per-road-class
 *    geometry becomes a guess: we render every incident as a uniform stripe centred on
 *    the road, no offset.
 *  - **Traffic-direction side** (`left_hand_traffic`) — only meaningful when paired with
 *    road-class-driven offset; irrelevant here.
 *  - **Declutter priority** (`display_class`) — the vector-tile pipeline hides
 *    low-priority incidents at low zooms; we show everything above the layer minzoom.
 *  - **Endpoint restriction** (`point_type`) — the vector-tile pipeline limits jam and
 *    closed-road icons to line endpoints; we render on every matching feature.
 *  - **Secondary cause** (`icon_category_1`) — the vector-tile pipeline layers a cause
 *    icon (e.g. accident) over the jam icon; we show only the primary category.
 *
 * Callers wanting full per-road-class visual fidelity should use
 * {@link TrafficIncidentsModule} instead.
 *
 * ## Known limitations
 *
 * - **Overlapping incidents** — when multiple incidents share the same point or stack
 *   along the same road segment, MapLibre's symbol collision culling keeps only the
 *   highest-sort-key feature. Culled features are also invisible to
 *   `queryRenderedFeatures`, so hover and click cannot reach them. If you need to
 *   surface multiple incidents at one location, query the source data directly
 *   (the `FeatureCollection` you passed to {@link show}) rather than relying on
 *   render-time hit-testing.
 *
 * @example
 * Fetch and render incidents for Amsterdam:
 * ```typescript
 * import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
 * import { TomTomMap, TrafficIncidentOverlayModule } from '@tomtom-org/maps-sdk/map';
 * import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
 *
 * TomTomConfig.instance.put({ apiKey: '<API_KEY>' });
 *
 * const map = new TomTomMap({ mapLibre: { container: 'map', center: [4.9, 52.37], zoom: 13 } });
 *
 * const overlay = await TrafficIncidentOverlayModule.get(map);
 * const result = await trafficIncidentDetails({
 *     bbox: [4.85, 52.34, 4.95, 52.40],
 *     timeValidityFilter: ['present'],
 * });
 * await overlay.show(result);
 *
 * // Highlight a subset.
 * overlay.setFocus([result.features[0].id as string]);
 * ```
 *
 * @see {@link TrafficIncidentsModule} — the vector-tile alternative. Hidden in the
 *   default style; if you've enabled it explicitly elsewhere in your app, hide it again
 *   before using the overlay to avoid double-rendering.
 * @see [Traffic Incident Overlay Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic-incident-overlay)
 * @see [Traffic Incident Details Service](https://docs.tomtom.com/maps-sdk-js/guides/services/traffic/traffic-incident-details)
 *
 * @group Traffic
 */
export class TrafficIncidentOverlayModule extends AbstractMapModule<Sources, TrafficIncidentOverlayConfig> {
    private static lastInstanceIndex = -1;
    private instanceIndex!: number;

    private lastResult: TrafficIncidentDetails | null = null;
    private lastFeatureIds: string[] = [];
    private lastFocusIds: readonly string[] | null = null;
    private readonly shownFeaturesHandlers: ((result: TrafficIncidentDetails) => void)[] = [];

    static async get(
        tomtomMap: TomTomMap,
        config?: TrafficIncidentOverlayConfig,
    ): Promise<TrafficIncidentOverlayModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new TrafficIncidentOverlayModule(tomtomMap, config ?? {});
    }

    private constructor(map: TomTomMap, config?: TrafficIncidentOverlayConfig) {
        super('geojson', map, config);
    }

    /** @ignore */
    protected _initSourcesWithLayers(config?: TrafficIncidentOverlayConfig, restore?: boolean): Sources {
        if (!restore) {
            TrafficIncidentOverlayModule.lastInstanceIndex++;
            this.instanceIndex = TrafficIncidentOverlayModule.lastInstanceIndex;
        }
        const sourceId = `traffic-incident-overlay-${this.instanceIndex}`;

        // Skipped in non-DOM envs — the image getter returns undefined there.
        const chevronImg = getIncidentDirectionChevronImage();
        if (chevronImg) {
            void addOrUpdateImage(
                'if-not-in-sprite',
                INCIDENT_DIRECTION_CHEVRON_IMAGE_ID,
                chevronImg,
                this.mapLibreMap,
            );
        }

        // Layers are inserted below `lowestLabel` by default so incidents sit under map
        // labels (roads, places, POIs) rather than obscuring them — matches the routing,
        // analytics, and geometries modules. Callers can override via `beforeLayerConfig`.
        const beforeID = resolveBeforeID(config?.beforeLayerConfig);
        const palette = readIncidentPalette(this.mapLibreMap);
        const focus = resolveFocusStyle(config?.focus);
        const layerSpecs = [
            ...buildCanonicalIncidentLineLayers(sourceId, beforeID, palette, focus),
            ...buildCanonicalIncidentSymbolLayers(sourceId, beforeID),
        ];

        return {
            incidents: new GeoJSONSourceWithLayers<TrafficIncidentDetails>(this.mapLibreMap, sourceId, layerSpecs),
        };
    }

    /** @ignore */
    protected _applyConfig(config: TrafficIncidentOverlayConfig | undefined): TrafficIncidentOverlayConfig | undefined {
        if (config?.visible === false) {
            this.sourcesWithLayers.incidents.setLayersVisible(false);
        } else {
            this.sourcesWithLayers.incidents.setLayersVisible(true);
        }
        this.applyBeforeLayer(config?.beforeLayerConfig);
        return config;
    }

    private applyBeforeLayer(beforeLayerConfig?: BeforeLayerConfig): void {
        const beforeId = resolveBeforeID(beforeLayerConfig);
        for (const lid of this.sourcesWithLayers.incidents.sourceAndLayerIDs.layerIDs) {
            this.mapLibreMap.moveLayer(lid, beforeId);
        }
    }

    /** @ignore */
    protected restoreDataAndConfigImpl(): void {
        this.initSourcesWithLayers(this.config, true);
        if (this.lastResult) {
            this.sourcesWithLayers.incidents.show(this.lastResult);
        }
        this._applyConfig(this.config);
        if (this.lastFocusIds !== null && this.lastFocusIds.length > 0) {
            this.setFocus(this.lastFocusIds);
        }
    }

    /**
     * Render the service result. Replaces any previously shown snapshot.
     */
    async show(result: TrafficIncidentDetails): Promise<void> {
        await this.waitUntilModuleReady();
        this.clearFeatureState();
        this.lastFocusIds = null;
        this.lastResult = result;
        this.lastFeatureIds = result.features.map((f) => f.id).filter((id): id is string => typeof id === 'string');
        this.sourcesWithLayers.incidents.show(result);
        for (const handler of this.shownFeaturesHandlers) {
            handler(result);
        }
    }

    /**
     * Remove all rendered incidents (source kept, data emptied).
     */
    async clear(): Promise<void> {
        await this.waitUntilModuleReady();
        this.clearFeatureState();
        this.lastResult = null;
        this.lastFeatureIds = [];
        this.lastFocusIds = null;
        this.sourcesWithLayers.incidents.clear();
    }

    /**
     * Show or hide all incident layers.
     */
    setVisible(visible: boolean): void {
        this.config = { ...this.config, visible };
        this.sourcesWithLayers.incidents.setLayersVisible(visible);
        this.emitConfigChange();
    }

    /**
     * Whether any incident layer is currently visible.
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.incidents.isAnyLayerVisible();
    }

    /**
     * Move incident layers before the given map-style layer, or to the top.
     */
    moveBeforeLayer(beforeLayerConfig: BeforeLayerConfig): void {
        this.config = { ...this.config, beforeLayerConfig };
        this.applyBeforeLayer(beforeLayerConfig);
        this.emitConfigChange();
    }

    /**
     * Incidents currently rendered in the viewport.
     */
    getShown(): { incidents: TrafficIncident[] } {
        const ids = this.sourcesWithLayers.incidents.sourceAndLayerIDs.layerIDs;
        const features = this.mapLibreMap.queryRenderedFeatures({
            layers: ids,
            validate: false,
        });
        return { incidents: this.distinctIncidents(features) };
    }

    /**
     * Reduce a hit-test result (typically the `features` argument in a click handler) to the
     * distinct incidents drawn at that point. Each incident renders across multiple layers
     * (outline + inner + symbol), so `queryRenderedFeatures` returns several entries per
     * incident — this de-duplicates by feature id.
     */
    distinctIncidents(features: readonly MapGeoJSONFeature[]): TrafficIncident[] {
        const seen = new Map<string | number, MapGeoJSONFeature>();
        for (const f of features) {
            const key = f.id ?? (f.properties as { id?: string } | null)?.id;
            if (key !== undefined && !seen.has(key)) seen.set(key, f);
        }
        // Cast: queryRenderedFeatures returns MapGeoJSONFeature; our source feeds TrafficIncident shapes.
        return [...seen.values()] as unknown as TrafficIncident[];
    }

    get events(): CombinedEvents<TrafficIncident, TrafficIncidentOverlayConfig, TrafficIncidentDetails> {
        return new CombinedEvents(
            new UserEvents<TrafficIncident>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.incidents,
                this.config?.events,
                // MapLibre flattens non-primitive feature properties to JSON strings when they
                // round-trip through the render pipeline (Date → ISO string, arrays/objects →
                // JSON). Look the feature up in our cached FeatureCollection by id to return
                // the original typed shape instead of the serialised form.
                (rendered) => this.findSourceFeature(rendered) ?? (rendered as unknown as TrafficIncident),
            ),
            new ModuleEvents(this.configChangeHandlers, this.shownFeaturesHandlers),
        );
    }

    /**
     * Mark a subset of currently-rendered incidents as "focused" via MapLibre
     * feature-state. `null` clears the state. Paint expressions in
     * `incidentDetailsLayers.ts` read `['feature-state', 'focused']` and pop the
     * focused subset (wider stripe + black outline). Unfocused features are
     * unchanged — the focus treatment adds emphasis, it does not dim the rest.
     *
     * No effect if called before `show()`.
     */
    setFocus(ids: readonly string[] | null): void {
        if (ids === null || ids.length === 0) {
            this.lastFocusIds = null;
            this.clearFeatureState();
            return;
        }
        if (this.lastFeatureIds.length === 0) return;
        this.lastFocusIds = ids;
        const focusSet = new Set<string>(ids);
        const sourceId = this.sourcesWithLayers.incidents.sourceAndLayerIDs.sourceID;
        for (const featId of this.lastFeatureIds) {
            this.mapLibreMap.setFeatureState({ source: sourceId, id: featId }, { focused: focusSet.has(featId) });
        }
    }

    private clearFeatureState(): void {
        if (this.lastFeatureIds.length === 0) return;
        const sourceId = this.sourcesWithLayers.incidents.sourceAndLayerIDs.sourceID;
        for (const featId of this.lastFeatureIds) {
            this.mapLibreMap.removeFeatureState({ source: sourceId, id: featId });
        }
    }

    private findSourceFeature(rendered: { properties?: { id?: unknown } | null }): TrafficIncident | undefined {
        const id = rendered.properties?.id;
        if (typeof id !== 'string' || !this.lastResult) return undefined;
        return this.lastResult.features.find((f) => f.properties.id === id);
    }
}
