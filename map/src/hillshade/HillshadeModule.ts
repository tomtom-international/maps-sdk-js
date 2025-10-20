import { isNil } from 'lodash-es';
import type { StyleModuleInitConfig } from '../shared';
import { AbstractMapModule, EventsModule, HILLSHADE_SOURCE_ID, StyleSourceWithLayers } from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { prepareForModuleInit } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import type { HillshadeModuleConfig } from '.';

/**
 * IDs of sources and layers for hillshade module.
 */
type HillshadeSourcesWithLayers = {
    hillshade: StyleSourceWithLayers;
};

/**
 * Hillshade Module for displaying terrain elevation shading on the map.
 *
 * This module controls the semi-transparent terrain layer that provides visual
 * depth and elevation context through shading effects.
 *
 * @remarks
 * **Features:**
 * - Toggle hillshade visibility on/off
 * - Based on vector tile elevation data
 * - Enhances 3D perception of terrain
 * - Lightweight rendering performance
 *
 * **Visual Effect:**
 * - Creates shadow/highlight effects based on terrain elevation
 * - Helps visualize mountains, valleys, and topographic features
 * - Complements flat map data with depth perception
 *
 * **Use Cases:**
 * - Outdoor and hiking applications
 * - Geographic analysis requiring terrain context
 * - Enhanced visual appeal for mountainous regions
 * - Educational and scientific visualizations
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { HillshadeModule } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Get module (will add hillshade to style if not present)
 * const hillshade = await HillshadeModule.get(map, {
 *   ensureAddedToStyle: true,
 *   visible: true
 * });
 *
 * // Toggle visibility
 * hillshade.setVisible(false);
 * hillshade.setVisible(true);
 *
 * // Check current state
 * console.log('Hillshade visible:', hillshade.isVisible());
 * ```
 *
 * @example
 * Event handling:
 * ```typescript
 * hillshade.events.on('click', (feature, lngLat) => {
 *   console.log('Clicked hillshade at:', lngLat);
 * });
 * ```
 *
 * @see [Hillshade Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/hillshade)
 *
 * @group Map Modules
 * @category Terrain
 */
export class HillshadeModule extends AbstractMapModule<HillshadeSourcesWithLayers, HillshadeModuleConfig> {
    /**
     * Retrieves a HillshadeModule instance for the given map.
     *
     * @param map - The TomTomMap instance to attach this module to.
     * @param config - Optional configuration for initialization and visibility.
     *
     * @returns A promise that resolves to the initialized HillshadeModule.
     *
     * @remarks
     * **Configuration:**
     * - `visible`: Initial visibility state
     * - `ensureAddedToStyle`: Auto-add hillshade to style if missing
     *
     * **Style Requirement:**
     * - Hillshade must be included in the map style or added via `ensureAddedToStyle`
     * - Some styles may not support hillshade (e.g., satellite)
     *
     * @throws Error if hillshade source is not in style and `ensureAddedToStyle` is false
     *
     * @example
     * Default initialization:
     * ```typescript
     * const hillshade = await HillshadeModule.get(map);
     * ```
     *
     * @example
     * Auto-add to style if missing:
     * ```typescript
     * const hillshade = await HillshadeModule.get(map, {
     *   ensureAddedToStyle: true,
     *   visible: true
     * });
     * ```
     *
     * @example
     * Start hidden:
     * ```typescript
     * const hillshade = await HillshadeModule.get(map, {
     *   visible: false
     * });
     * ```
     */
    static async get(map: TomTomMap, config?: StyleModuleInitConfig & HillshadeModuleConfig): Promise<HillshadeModule> {
        await prepareForModuleInit(map, config?.ensureAddedToStyle, HILLSHADE_SOURCE_ID, 'hillshade');
        return new HillshadeModule(map, config);
    }

    private constructor(map: TomTomMap, config?: HillshadeModuleConfig) {
        super('style', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const hillshadeSource = this.mapLibreMap.getSource(HILLSHADE_SOURCE_ID);
        if (!hillshadeSource) {
            throw notInTheStyle(`init ${HillshadeModule.name} with source ID ${HILLSHADE_SOURCE_ID}`);
        }
        return { hillshade: new StyleSourceWithLayers(this.mapLibreMap, hillshadeSource) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: HillshadeModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        return config;
    }

    /**
     * Sets the visibility of the hillshade layer.
     *
     * @param visible - `true` to show hillshade, `false` to hide it.
     *
     * @remarks
     * Changes are applied immediately if the map is ready.
     *
     * @example
     * ```typescript
     * hillshade.setVisible(true);  // Show terrain shading
     * hillshade.setVisible(false); // Hide terrain shading
     * ```
     */
    setVisible(visible: boolean): void {
        this.config = {
            ...this.config,
            visible,
        };

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.hillshade.setLayersVisible(visible);
        }
    }

    /**
     * Checks if the hillshade layer is currently visible.
     *
     * @returns `true` if visible, `false` if hidden.
     *
     * @example
     * ```typescript
     * if (hillshade.isVisible()) {
     *   console.log('Terrain shading is active');
     * }
     * ```
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.hillshade.isAnyLayerVisible();
    }

    /**
     * Gets the events interface for handling user interactions with hillshade.
     *
     * @returns An EventsModule instance for registering event handlers.
     *
     * @remarks
     * **Supported Events:**
     * - `click`: User clicks on the hillshade layer
     * - `contextmenu`: User right-clicks
     * - `hover`: Mouse enters hillshade area
     * - `long-hover`: Extended hover
     *
     * @example
     * ```typescript
     * hillshade.events.on('click', (feature, lngLat) => {
     *   console.log('Clicked terrain at:', lngLat);
     * });
     * ```
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.hillshade);
    }
}
