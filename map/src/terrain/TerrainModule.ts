import type { TerrainSpecification } from 'maplibre-gl';
import {
    AbstractStyleOwnedMapModule,
    HILLSHADE_SOURCE_ID,
    type ModuleEvents,
    StyleSourceWithLayers,
    sharedInstance,
    TERRAIN_SOURCE_ID,
    TomTomMapSource,
} from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { ensureAddedToStyle, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import type { TerrainModuleConfig } from './types/terrainModuleConfig';

/**
 * The style source this module draws from: the raster-dem elevation source of the hillshade
 * style part, with its hillshade layers.
 */
type TerrainSourcesWithLayers = {
    hillshade: StyleSourceWithLayers;
};

const DEFAULT_EXAGGERATION = 1;

/**
 * Map module for the terrain relief: hillshade shading and the 3D surface, both drawn from the
 * elevation data of the map style.
 *
 * @remarks
 * - **Hillshade** shades slopes on the flat map, so the relief reads at any pitch.
 * - **Elevation** raises the map surface in 3D, which a pitched camera shows. Combined with the
 *   hillshade, a slope stays readable where the camera flattens it.
 *
 * `get()` adds the elevation style part when the style lacks it, and the module restores both
 * after every style change. The 3D surface reads its own copy of the elevation source,
 * {@link TERRAIN_SOURCE_ID}.
 *
 * @example
 * ```typescript
 * const terrain = await TerrainModule.get(map, { hillshade: true, elevation: true, elevationExaggeration: 1.3 });
 * terrain.setElevationExaggeration(2);
 * terrain.setElevationEnabled(false); // flat again, still shaded
 * ```
 *
 * @see [Terrain Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/terrain)
 *
 * @group Terrain
 */
export class TerrainModule extends AbstractStyleOwnedMapModule<TerrainSourcesWithLayers, TerrainModuleConfig> {
    // The terrain the loaded style, or the caller's own MapLibre code, raised before this module
    // did: an unset `elevation` leaves it on screen, and a reset puts it back.
    private mapTerrain!: TerrainSpecification | null;
    // Whether an explicit `elevation`, raised or flat, replaced `mapTerrain`. No initializer: the
    // base constructor applies the first config, and an initializer would run after it.
    private overridesMapTerrain!: boolean;

    /**
     * Retrieves the terrain module of the given map, adding the elevation style part first when
     * the style lacks it.
     *
     * @param config - Without it the hillshade is hidden, and the surface stays as the map draws it.
     *
     * @remarks
     * **Instances:** one per map — a second `get()` returns the same instance, with the given config
     * applied to it.
     *
     * @throws Error if the elevation source cannot be added to the style.
     */
    static async get(map: TomTomMap, config?: TerrainModuleConfig): Promise<TerrainModule> {
        await waitUntilMapIsReady(map);
        await ensureAddedToStyle(map, HILLSHADE_SOURCE_ID, 'hillshade');
        return sharedInstance(
            map,
            TerrainModule,
            () => new TerrainModule(map, config),
            config && ((existing) => existing.applyConfig(config)),
        );
    }

    private constructor(map: TomTomMap, config?: TerrainModuleConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const elevationSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (!elevationSource) {
            throw notInTheStyle(`init ${TerrainModule.name} with source ID ${HILLSHADE_SOURCE_ID}`);
        }
        // Runs on every style load before `_applyConfig`, which is what may replace this terrain.
        const mapTerrain = this.mapLibreMap.getTerrain();
        if (mapTerrain?.source !== TERRAIN_SOURCE_ID) {
            this.mapTerrain = mapTerrain;
        }
        return { hillshade: new StyleSourceWithLayers(this.mapLibreMap, elevationSource) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: TerrainModuleConfig | undefined) {
        this.showHillshade(config?.hillshade ?? false);
        this.showElevation(config?.elevation, config?.elevationExaggeration ?? DEFAULT_EXAGGERATION);
        return config;
    }

    /**
     * Shows or hides the hillshade shading.
     */
    setHillshadeVisible(visible: boolean): void {
        this.showHillshade(visible);
        this.storeConfig({ hillshade: visible });
    }

    /**
     * Whether the hillshade shading is shown.
     */
    isHillshadeVisible(): boolean {
        return this.sourcesWithLayers.hillshade.isAnyLayerVisible();
    }

    /**
     * Raises the map surface in 3D, or flattens it, keeping the configured exaggeration.
     */
    setElevationEnabled(enabled: boolean): void {
        this.showElevation(enabled, this.config?.elevationExaggeration ?? DEFAULT_EXAGGERATION);
        this.storeConfig({ elevation: enabled });
    }

    /**
     * Whether the map surface is raised in 3D.
     */
    isElevationEnabled(): boolean {
        return this.mapLibreMap.getTerrain() !== null;
    }

    /**
     * Sets the vertical {@link TerrainModuleConfig.elevationExaggeration | exaggeration} of the 3D
     * surface, kept for when elevation is enabled later.
     */
    setElevationExaggeration(elevationExaggeration: number): void {
        this.showElevation(this.config?.elevation, elevationExaggeration);
        this.storeConfig({ elevationExaggeration });
    }

    /**
     * Lifecycle events of this module. The hillshade is a raster layer with no features to
     * interact with, so there are no user interaction events; `config-change` fires after every
     * change.
     *
     * @example
     * ```typescript
     * const unsubscribe = terrain.events.on('config-change', (config) => console.log(config));
     * ```
     */
    get events(): ModuleEvents<TerrainModuleConfig> {
        return this.lifecycleEvents();
    }

    private showHillshade(visible: boolean): void {
        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.hillshade.setLayersVisible(visible);
        }
    }

    private showElevation(enabled: boolean | undefined, exaggeration: number): void {
        if (!this.tomtomMap.mapReady) return;

        if (enabled === undefined) {
            if (this.overridesMapTerrain) {
                this.mapLibreMap.setTerrain(this.mapTerrain);
            }
        } else if (enabled) {
            // Added lazily, so a map that only shows the hillshade loads each elevation tile once.
            new TomTomMapSource(TERRAIN_SOURCE_ID, this.sourcesWithLayers.hillshade.source.spec).ensureAddedToMap(
                this.mapLibreMap,
            );
            this.mapLibreMap.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration });
        } else {
            this.mapLibreMap.setTerrain(null);
        }
        this.overridesMapTerrain = enabled !== undefined;
    }

    private storeConfig(change: Partial<TerrainModuleConfig>): void {
        this.config = { ...this.config, ...change };
        this.emitConfigChange();
    }
}
