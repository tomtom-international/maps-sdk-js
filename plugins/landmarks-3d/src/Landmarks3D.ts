import { isProxyCredentialsMode } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { FilterSpecification } from 'maplibre-gl';
import {
    type BasemapBuildingMaterial,
    type Landmarks3DDisplayMode,
    type LandmarksMaterialState,
    resolveDisplayMode,
} from './displayMode';
import { buildLandmarksTileURL } from './landmarksTileURL';
import { ModelsLayer } from './ModelsLayer';
import type { ModelsLayerSpecification, ModelsSourceSpecification } from './types/modelsSpecifications';

// Load landmark tiles at a single zoom level: the meshes are full-detail at this zoom and upscale
const SOURCE_ZOOM = 15;

const DEFAULT_LAYER_ID = 'orbis-3d-landmarks';
const DEFAULT_LAYER_MIN_ZOOM = 10;
const DEFAULT_LAYER_MAX_ZOOM = 22;

// Filters out basemap extruded buildings that overlap a landmark, so they don't clip through its mesh.
const DEFAULT_BASEMAP_BUILDING_LAYER_ID = '3D - Building';
const NO_LANDMARK_FILTER_CLAUSE: FilterSpecification = ['!', ['coalesce', ['get', 'has_landmark'], false]];

// Resolves `fill-extrusion-color` to one CSS colour, for `match` expressions, the last operand is the default.
const extractColorFromPaint = (paintColor: unknown): string | null => {
    if (typeof paintColor === 'string') {
        return paintColor;
    }

    if (Array.isArray(paintColor) && paintColor[0] === 'match') {
        const fallback = paintColor.at(-1);
        if (typeof fallback === 'string') {
            return fallback;
        }
    }

    return null;
};

/**
 * Configuration for the {@link Landmarks3D} plugin.
 *
 * @group Landmarks 3D
 */
export type Landmarks3DOptions = {
    /**
     * Initial display mode for the landmarks. Can also be changed at runtime with
     * {@link Landmarks3D.setDisplayMode}.
     * @defaultValue `'inherited'`
     */
    displayMode?: Landmarks3DDisplayMode;
    /**
     * Whether the landmarks are initially visible. Can also be changed at runtime with
     * {@link Landmarks3D.setVisible}.
     * @defaultValue `true`
     */
    visible?: boolean;
    /**
     * Minimum zoom at which landmarks are rendered.
     * @defaultValue The basemap 3D building layer's minimum zoom, so landmarks appear together
     * with it (falls back to `10` when that layer is absent).
     */
    minZoom?: number;
    /**
     * Maximum zoom at which landmarks are rendered.
     * @defaultValue The basemap 3D building layer's maximum zoom, so landmarks disappear together
     * with it (falls back to `22` when that layer is absent).
     */
    maxZoom?: number;
    /**
     * Send `credentials: 'include'` with each tile request so a proxy session
     * cookie travels with it. By default this tracks the SDK's proxy config, so
     * tiles behave like every other SDK request; set it explicitly only to
     * override that.
     * @defaultValue Auto-detected — `true` when the SDK is configured for a
     * credentialed proxy (no `apiKey` + non-default `commonBaseURL`).
     */
    withCredentials?: boolean;
};

/**
 * Renders TomTom Orbis 3D Landmarks (high-detail building meshes) on a {@link TomTomMap}.
 *
 * The plugin streams GLB tiles from the Orbis 3D Landmarks API (Private Preview),
 * renders them with Three.js via a MapLibre custom layer, filters overlapping
 * extruded basemap buildings out of the style, and keeps everything restored
 * across map style changes.
 *
 * @remarks
 * Requires an API key with Orbis 3D Landmarks entitlements and a map style that
 * shows extruded 3D buildings for the exclusion filter and `inherited` mode to
 * have an effect.
 *
 * @example
 * ```typescript
 * import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
 *
 * // assume `map` is your initialized TomTomMap instance
 * const landmarks = new Landmarks3D(map);
 *
 * await landmarks.setDisplayMode('inherited');
 * ```
 *
 * @group Landmarks 3D
 */
export class Landmarks3D {
    private readonly map: TomTomMap;
    private readonly layerID = DEFAULT_LAYER_ID;
    private readonly basemapBuildingLayerID = DEFAULT_BASEMAP_BUILDING_LAYER_ID;
    private readonly modelsLayer: ModelsLayer;
    // Explicit zoom-range overrides; when unset, the range tracks the basemap 3D building layer.
    private readonly layerMinZoom?: number;
    private readonly layerMaxZoom?: number;
    private displayMode: Landmarks3DDisplayMode;

    /**
     * Creates the plugin bound to a TomTom map and starts rendering landmarks
     * as soon as the map is ready.
     *
     * @param map - The TomTom map instance to render landmarks on.
     * @param options - Optional configuration.
     */
    constructor(map: TomTomMap, options: Landmarks3DOptions = {}) {
        this.map = map;
        this.layerMinZoom = options.minZoom;
        this.layerMaxZoom = options.maxZoom;
        this.displayMode = options.displayMode ?? 'inherited';

        const layerSpecification: ModelsLayerSpecification = {
            id: this.layerID,
            type: 'models',
            source: this.layerID,
            minzoom: options.minZoom ?? DEFAULT_LAYER_MIN_ZOOM,
            maxzoom: options.maxZoom ?? DEFAULT_LAYER_MAX_ZOOM,
        };
        const sourceSpecification: ModelsSourceSpecification = {
            type: 'models',
            tiles: [buildLandmarksTileURL()],
            minzoom: SOURCE_ZOOM,
            maxzoom: SOURCE_ZOOM,
            withCredentials: options.withCredentials ?? isProxyCredentialsMode(),
        };
        this.modelsLayer = new ModelsLayer(layerSpecification, sourceSpecification);
        this.modelsLayer.visible = options.visible ?? true;

        this.map.addStyleChangeHandler({
            onStyleChanged: () => this.install(),
        });
        this.installWhenReady();
    }

    // Installs the layer as soon as the map is ready
    private installWhenReady(): void {
        if (this.map.mapReady) {
            this.install();
        } else {
            this.map.mapLibreMap.once('styledata', () => this.installWhenReady());
        }
    }

    /**
     * The underlying MapLibre custom layer, for advanced use beyond this facade.
     */
    get layer(): ModelsLayer {
        return this.modelsLayer;
    }

    /**
     * The currently applied display mode.
     */
    getDisplayMode(): Landmarks3DDisplayMode {
        return this.displayMode;
    }

    /**
     * Changes how landmarks are rendered relative to the base map.
     *
     * @param mode - The display mode to apply.
     * @returns A promise that resolves once the mode has been applied.
     */
    async setDisplayMode(mode: Landmarks3DDisplayMode): Promise<void> {
        this.displayMode = mode;
        // Before the map is ready the layer isn't installed; install() applies the stored
        // mode once it runs, so simply recording it above is enough in that case.
        if (this.map.mapReady) {
            this.applyDisplayMode();
        }
    }

    /**
     * Whether the landmarks are currently visible.
     */
    isVisible(): boolean {
        return this.modelsLayer.visible;
    }

    /**
     * Shows or hides the landmarks layer.
     *
     * @param visible - `true` to show landmarks, `false` to hide them.
     * @returns A promise that resolves once the visibility has been applied.
     */
    async setVisible(visible: boolean): Promise<void> {
        this.modelsLayer.visible = visible;
        // When the map isn't ready yet the layer is added (with this visibility) by
        // install(); only an already-installed layer needs an explicit repaint here.
        if (this.map.mapReady) {
            this.map.mapLibreMap.triggerRepaint();
        }
    }

    // (Re-)adds the layer and re-applies filter + display mode on first readiness and after style changes.
    private install(): void {
        const mapLibreMap = this.map.mapLibreMap;
        if (!mapLibreMap.getLayer(this.layerID)) {
            mapLibreMap.addLayer(this.modelsLayer);
        }

        // The standard styles ship the 3D building layer hidden; show it so landmarks get a 3D city context.
        if (mapLibreMap.getLayer(this.basemapBuildingLayerID)) {
            mapLibreMap.setLayoutProperty(this.basemapBuildingLayerID, 'visibility', 'visible');
        }

        this.alignZoomRangeWithBasemapBuildings();
        this.excludeLandmarkBuildingsFromBasemap();

        // Late-arriving tiles load with opaque materials; re-apply non-opaque looks to them.
        this.modelsLayer.source.onTileLoaded = () => {
            if (this.resolveCurrentMaterialState().opacity < 1) {
                this.applyDisplayMode();
            }
        };

        this.applyDisplayMode();
    }

    // Tracks the basemap 3D building layer's zoom range so landmarks appear and disappear together with
    // it, unless the caller pinned an explicit min/max zoom. No-op when the building layer is absent.
    private alignZoomRangeWithBasemapBuildings(): void {
        const buildingLayer = this.map.mapLibreMap.getLayer(this.basemapBuildingLayerID);
        if (!buildingLayer) {
            return;
        }

        this.modelsLayer.minzoom = this.layerMinZoom ?? buildingLayer.minzoom ?? DEFAULT_LAYER_MIN_ZOOM;
        this.modelsLayer.maxzoom = this.layerMaxZoom ?? buildingLayer.maxzoom ?? DEFAULT_LAYER_MAX_ZOOM;
    }

    private excludeLandmarkBuildingsFromBasemap(): void {
        const mapLibreMap = this.map.mapLibreMap;
        if (!mapLibreMap.getLayer(this.basemapBuildingLayerID)) {
            return;
        }

        const existing = mapLibreMap.getFilter(this.basemapBuildingLayerID);
        if (existing && JSON.stringify(existing).includes(JSON.stringify(NO_LANDMARK_FILTER_CLAUSE))) {
            return;
        }

        // Asserted because `['all', ...]` arms span FilterSpecification's expression and legacy variants.
        const combined = (
            existing ? ['all', existing, NO_LANDMARK_FILTER_CLAUSE] : NO_LANDMARK_FILTER_CLAUSE
        ) as FilterSpecification;
        mapLibreMap.setFilter(this.basemapBuildingLayerID, combined);
    }

    // Reads the basemap building colour for `inherited` mode; null when absent or not resolvable to one colour.
    private readBasemapBuildingMaterial(): BasemapBuildingMaterial | null {
        const mapLibreMap = this.map.mapLibreMap;
        if (!mapLibreMap.getLayer(this.basemapBuildingLayerID)) {
            return null;
        }

        const paintColor = mapLibreMap.getPaintProperty(this.basemapBuildingLayerID, 'fill-extrusion-color');
        const diffuse = extractColorFromPaint(paintColor);
        if (!diffuse) {
            return null;
        }

        return { diffuse };
    }

    private resolveCurrentMaterialState(): LandmarksMaterialState {
        const basemapMaterial = this.displayMode === 'inherited' ? this.readBasemapBuildingMaterial() : null;
        return resolveDisplayMode(this.displayMode, basemapMaterial);
    }

    private applyDisplayMode(): void {
        const state = this.resolveCurrentMaterialState();
        this.modelsLayer.diffuseColor = state.diffuseColor;
        this.modelsLayer.setOpacity(state.opacity);
        this.map.mapLibreMap.triggerRepaint();
    }
}
