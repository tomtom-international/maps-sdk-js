import { isEmpty, isNil, omitBy } from 'lodash-es';
import type { FilterSpecification } from 'maplibre-gl';
import type { LayerSpecWithSource } from '../shared';
import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    StyleSourceWithLayers,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { ensureAddedToStyle, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { applyFilter, buildMapLibreIncidentFilters } from './filters/trafficFilters';
import type { IncidentsConfig, TrafficIncidentsFilters } from './types/trafficModuleConfig';

/**
 * IDs of sources and layers for traffic incidents module.
 */
type TrafficIncidentsSourcesWithLayers = {
    trafficIncidents: StyleSourceWithLayers;
};

/**
 * Traffic Incidents Module for displaying and configuring real-time traffic incidents on the map.
 *
 * This module controls the vector tile traffic incidents layers that show traffic
 * events like accidents, road closures, construction, and hazards.
 *
 * @remarks
 * **Features:**
 * - Toggle incidents visibility on/off
 * - Separate control for incident icons
 * - Filter by incident type (accident, construction, etc.)
 * - Filter by severity/delay magnitude
 * - Filter by road categories
 * - Icon and line/polygon visualization
 *
 * **Incident Types:**
 * - Accidents
 * - Road closures
 * - Construction/road works
 * - Weather conditions (fog, ice, rain, etc.)
 * - Lane closures
 * - Traffic jams
 * - Broken down vehicles
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { TrafficIncidentsModule } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Get module (auto-add to style if needed)
 * const incidents = await TrafficIncidentsModule.get(map, {
 *   visible: true
 * });
 *
 * // Toggle visibility
 * incidents.setVisible(false);
 * incidents.setVisible(true);
 *
 * // Control icons separately
 * incidents.setIconsVisible(false);
 * ```
 *
 * @example
 * Filter by incident type:
 * ```typescript
 * // Show only accidents and road closures
 * incidents.filter({
 *   any: [{
 *     incidentCategories: {
 *       show: 'only',
 *       values: ['accident', 'road_closed']
 *     }
 *   }]
 * });
 *
 * // Hide construction
 * incidents.filter({
 *   any: [{
 *     incidentCategories: {
 *       show: 'all_except',
 *       values: ['road_works']
 *     }
 *   }]
 * });
 * ```
 *
 * @example
 * Filter by severity:
 * ```typescript
 * // Show only major delays
 * incidents.filter({
 *   any: [{
 *     magnitudes: {
 *       show: 'only',
 *       values: ['major']
 *     }
 *   }]
 * });
 *
 * // Show incidents with at least 10 minutes delay
 * incidents.filter({
 *   any: [{
 *     delays: {
 *       mustHaveDelay: true,
 *       minDelayMinutes: 10
 *     }
 *   }]
 * });
 * ```
 *
 * @example
 * Filter icons separately from incident areas:
 * ```typescript
 * // Show all incidents but only major icons
 * incidents.filter(
 *   {
 *     any: [{}] // Show all incidents
 *   },
 *   {
 *     any: [{
 *       magnitudes: { show: 'only', values: ['major'] }
 *     }]
 *   }
 * );
 * ```
 *
 * @see [Traffic Incidents Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic-incidents)
 * @see [Traffic Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic)
 *
 * @group Traffic Incidents
 */
export class TrafficIncidentsModule extends AbstractMapModule<TrafficIncidentsSourcesWithLayers, IncidentsConfig> {
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Retrieves a TrafficIncidentsModule instance for the given map.
     *
     * @param map - The TomTomMap instance to attach this module to.
     * @param config - Optional configuration for initialization, visibility, and filters.
     *
     * @returns A promise that resolves to the initialized TrafficIncidentsModule.
     *
     * @remarks
     * **Configuration:**
     * - `visible`: Initial visibility state for all incidents
     * - `icons.visible`: Initial visibility for incident icons
     * - `ensureAddedToStyle`: Auto-add traffic incidents to style if missing
     * - `filters`: Incident type, severity, and delay filters
     * - `icons.filters`: Separate filters for icons
     *
     * @throws Error if traffic incidents source is not in style and `ensureAddedToStyle` is false
     *
     * @example
     * Default initialization:
     * ```typescript
     * const incidents = await TrafficIncidentsModule.get(map);
     * ```
     *
     * @example
     * With configuration:
     * ```typescript
     * const incidents = await TrafficIncidentsModule.get(map, {
     *   visible: true,
     *   icons: { visible: true },
     *   filters: {
     *     any: [{
     *       incidentCategories: {
     *         show: 'only',
     *         values: ['accident', 'road_closed', 'jam']
     *       }
     *     }]
     *   }
     * });
     * ```
     */
    static async get(map: TomTomMap, config?: IncidentsConfig): Promise<TrafficIncidentsModule> {
        await waitUntilMapIsReady(map);
        await ensureAddedToStyle(map, TRAFFIC_INCIDENTS_SOURCE_ID, 'trafficIncidents');
        return new TrafficIncidentsModule(map, config);
    }

    private constructor(map: TomTomMap, config?: IncidentsConfig) {
        super('style', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const incidentsSource = this.mapLibreMap.getSource(TRAFFIC_INCIDENTS_SOURCE_ID);
        if (!incidentsSource) {
            throw notInTheStyle(`init ${TrafficIncidentsModule.name} with source ID ${TRAFFIC_INCIDENTS_SOURCE_ID}`);
        }
        this.originalFilters = {};
        for (const layer of this.getLayers()) {
            this.originalFilters[layer.id] = layer.filter;
        }
        return { trafficIncidents: new StyleSourceWithLayers(this.mapLibreMap, incidentsSource) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: IncidentsConfig | undefined) {
        // We do not update config in setVisible since it could override icons visibility setting:
        this._setVisible(config?.visible ?? false, { updateConfig: false });
        if (!isNil(config?.icons?.visible)) {
            this.setIconsVisible(config.icons.visible);
        }
        this._filter(config?.filters, config?.icons?.filters, false);
        console.log(config);
        return config;
    }

    /**
     * Applies filters to traffic incidents display.
     *
     * @param incidentFilters - Filter for incident areas/lines. Pass `undefined` to reset.
     * @param iconFilters - Optional separate filter for incident icons. Pass `undefined` to reset.
     *
     * @remarks
     * **Filter Options:**
     * - `incidentCategories`: Filter by incident type
     * - `magnitudes`: Filter by delay severity (minor/moderate/major/unknown)
     * - `delays`: Filter by delay duration
     * - `roadCategories`: Filter by road importance
     * - `roadSubCategories`: Filter by specific road types
     *
     * **Available Incident Categories:**
     * - `accident`, `road_closed`, `lane_closed`
     * - `road_works` (construction)
     * - `jam` (traffic jam)
     * - `fog`, `rain`, `ice`, `wind`, `flooding`
     * - `dangerous_conditions`
     * - `broken_down_vehicle`
     * - `unknown`
     *
     * **Delay Magnitudes:**
     * - `minor`: Small delays
     * - `moderate`: Moderate delays
     * - `major`: Significant delays
     * - `unknown`: Unknown or no delay info
     *
     * @example
     * Filter by type:
     * ```typescript
     * incidents.filter({
     *   any: [{
     *     incidentCategories: {
     *       show: 'only',
     *       values: ['accident', 'road_closed']
     *     }
     *   }]
     * });
     * ```
     *
     * @example
     * Filter by severity and delay:
     * ```typescript
     * incidents.filter({
     *   any: [{
     *     magnitudes: { show: 'only', values: ['major', 'moderate'] },
     *     delays: {
     *       mustHaveDelay: true,
     *       minDelayMinutes: 5
     *     }
     *   }]
     * });
     * ```
     *
     * @example
     * Different filters for icons and areas:
     * ```typescript
     * // Show all incidents on roads
     * const incidentFilter = {
     *   any: [{
     *     roadCategories: { show: 'only', values: ['motorway', 'trunk'] }
     *   }]
     * };
     *
     * // But only show icons for major incidents
     * const iconFilter = {
     *   any: [{
     *     magnitudes: { show: 'only', values: ['major'] }
     *   }]
     * };
     *
     * incidents.filter(incidentFilter, iconFilter);
     * ```
     */
    filter(incidentFilters?: TrafficIncidentsFilters, iconFilters?: TrafficIncidentsFilters) {
        this._filter(incidentFilters, iconFilters);
    }

    private _filter(
        incidentFilters: TrafficIncidentsFilters | undefined,
        iconFilters: TrafficIncidentsFilters | undefined,
        updateConfig = true,
    ) {
        if (this.tomtomMap.mapReady) {
            if (incidentFilters?.any?.length) {
                const incidentFilterExpression = buildMapLibreIncidentFilters(incidentFilters);
                if (incidentFilterExpression) {
                    const layers = iconFilters ? this.getNonSymbolLayers() : this.getLayers();
                    applyFilter(incidentFilterExpression, layers, this.mapLibreMap, this.originalFilters);
                }
            } else if (this.config?.filters?.any?.length) {
                applyFilter(undefined, this.getLayers(), this.mapLibreMap, this.originalFilters);
            }
            if (iconFilters?.any?.length) {
                const iconFilterExpression = buildMapLibreIncidentFilters(iconFilters);
                if (iconFilterExpression) {
                    applyFilter(iconFilterExpression, this.getSymbolLayers(), this.mapLibreMap, this.originalFilters);
                }
            }
        }

        // else: default incidents visibility has been set already if necessary
        if (updateConfig) {
            this.config = omitBy(
                {
                    ...this.config,
                    filters: incidentFilters,
                    icons: { ...this.config?.icons, filters: iconFilters },
                },
                isNil,
            );
        }
    }

    private getLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [TRAFFIC_INCIDENTS_SOURCE_ID]);
    }

    private getSymbolLayers(): LayerSpecWithSource[] {
        return this.getLayers().filter((layer) => layer.type === 'symbol');
    }

    private getNonSymbolLayers(): LayerSpecWithSource[] {
        return this.getLayers().filter((layer) => layer.type != 'symbol');
    }

    /**
     * Sets the visibility of incident icon layers.
     *
     * @param visible - `true` to show icons, `false` to hide them.
     *
     * @remarks
     * This controls only the icon/symbol layers, not the incident area polygons or lines.
     *
     * @example
     * ```typescript
     * // Hide icons but keep incident areas visible
     * incidents.setIconsVisible(false);
     *
     * // Show icons
     * incidents.setIconsVisible(true);
     * ```
     */
    setIconsVisible(visible: boolean): void {
        // We adjust the config for this change (but it might be overwritten if it's part of an "applyConfig" call)
        this.config = { ...this.config, icons: { ...this.config?.icons, visible } };

        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.trafficIncidents.setLayersVisible(
                visible,
                (layerSpec) => layerSpec.type === 'symbol',
            );
        }
    }

    /**
     * Sets the visibility of all traffic incident layers.
     *
     * @param visible - `true` to show incidents, `false` to hide them.
     *
     * @remarks
     * This controls all incident layers including icons, lines, and polygons.
     *
     * @example
     * ```typescript
     * incidents.setVisible(false); // Hide all incidents
     * incidents.setVisible(true);  // Show all incidents
     * ```
     */
    setVisible(visible: boolean): void {
        this._setVisible(visible);
    }

    private _setVisible(visible: boolean, options?: { updateConfig: boolean }): void {
        const updateConfig = options?.updateConfig ?? true;
        if (updateConfig) {
            // setting all traffic visible also nullifies the icons visible setting
            delete this.config?.icons?.visible;
            // we remove empty values from config to avoid confusion (in case icons part is just empty after deleting visible)
            this.config = { ...omitBy({ ...this.config }, isEmpty), visible };
        }
        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.trafficIncidents.setLayersVisible(visible);
        }
    }

    /**
     * Checks if any traffic incident layers are currently visible.
     *
     * @returns `true` if any incident layer is visible, `false` if all are hidden.
     *
     * @example
     * ```typescript
     * if (incidents.isVisible()) {
     *   console.log('Incidents are displayed');
     * }
     * ```
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.trafficIncidents.isAnyLayerVisible();
    }

    /**
     * Checks if any incident icon layers are currently visible.
     *
     * @returns `true` if any icon layer is visible, `false` if all icons are hidden.
     *
     * @example
     * ```typescript
     * if (incidents.anyIconLayersVisible()) {
     *   console.log('Incident icons are shown');
     * }
     * ```
     */
    anyIconLayersVisible(): boolean {
        return !!this.sourcesWithLayers.trafficIncidents?.isAnyLayerVisible((layerSpec) => layerSpec.type === 'symbol');
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.trafficIncidents);
    }
}
