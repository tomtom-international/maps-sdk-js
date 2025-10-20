import { isNil, omitBy } from 'lodash-es';
import type { FilterSpecification } from 'maplibre-gl';
import type { LayerSpecWithSource, StyleModuleInitConfig } from '../shared';
import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    StyleSourceWithLayers,
    TRAFFIC_FLOW_SOURCE_ID,
} from '../shared';
import { notInTheStyle } from '../shared/errorMessages';
import { prepareForModuleInit } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { applyFilter, buildMapLibreFlowFilters } from './filters/trafficFilters';
import type { FlowConfig, TrafficFlowFilters } from './types/trafficModuleConfig';

/**
 * IDs of sources and layers for traffic flow module.
 */
type TrafficFlowSourcesWithLayers = {
    trafficFlow: StyleSourceWithLayers;
};

/**
 * Traffic Flow Module for displaying real-time traffic flow information on the map.
 *
 * This module controls the vector tile traffic flow layers that visualize current
 * traffic speed conditions using color-coded road segments.
 *
 * @remarks
 * **Features:**
 * - Toggle traffic flow visibility on/off
 * - Filter by road categories and types
 * - Color-coded speed visualization (green = free flow, red = congestion)
 * - Real-time traffic data from vector tiles
 * - Filter road closures
 *
 * **Visual Representation:**
 * - Green: Free-flowing traffic
 * - Yellow/Orange: Slow traffic
 * - Red: Heavy congestion
 * - Dark gray: Road closures
 *
 * **Use Cases:**
 * - Real-time traffic monitoring
 * - Route planning with current conditions
 * - Traffic analysis applications
 * - Navigation systems
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { TrafficFlowModule } from '@tomtom-international/maps-sdk-js/map';
 *
 * // Get module (auto-add to style if needed)
 * const trafficFlow = await TrafficFlowModule.get(map, {
 *   ensureAddedToStyle: true,
 *   visible: true
 * });
 *
 * // Toggle visibility
 * trafficFlow.setVisible(false);
 * trafficFlow.setVisible(true);
 * ```
 *
 * @example
 * Filter by road type:
 * ```typescript
 * // Show only highway traffic
 * trafficFlow.filter({
 *   any: [{
 *     roadCategories: {
 *       show: 'only',
 *       values: ['motorway', 'trunk']
 *     }
 *   }]
 * });
 *
 * // Hide local streets
 * trafficFlow.filter({
 *   any: [{
 *     roadCategories: {
 *       show: 'all_except',
 *       values: ['street']
 *     }
 *   }]
 * });
 * ```
 *
 * @example
 * Show only road closures:
 * ```typescript
 * trafficFlow.filter({
 *   any: [{
 *     showRoadClosures: 'only'
 *   }]
 * });
 * ```
 *
 * @see [Traffic Flow Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic-flow)
 * @see [Traffic Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/traffic)
 *
 * @group Map Modules
 * @category Traffic
 */
export class TrafficFlowModule extends AbstractMapModule<TrafficFlowSourcesWithLayers, FlowConfig> {
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Retrieves a TrafficFlowModule instance for the given map.
     *
     * @param map - The TomTomMap instance to attach this module to.
     * @param config - Optional configuration for initialization, visibility, and filters.
     *
     * @returns A promise that resolves to the initialized TrafficFlowModule.
     *
     * @remarks
     * **Configuration:**
     * - `visible`: Initial visibility state
     * - `ensureAddedToStyle`: Auto-add traffic flow to style if missing
     * - `filters`: Road category and type filters
     *
     * **Style Requirement:**
     * Traffic flow must be included in the map style or added via `ensureAddedToStyle`.
     *
     * @throws Error if traffic flow source is not in style and `ensureAddedToStyle` is false
     *
     * @example
     * Default initialization:
     * ```typescript
     * const trafficFlow = await TrafficFlowModule.get(map);
     * ```
     *
     * @example
     * Auto-add to style:
     * ```typescript
     * const trafficFlow = await TrafficFlowModule.get(map, {
     *   ensureAddedToStyle: true,
     *   visible: true,
     *   filters: {
     *     any: [{
     *       roadCategories: {
     *         show: 'only',
     *         values: ['motorway', 'trunk', 'primary']
     *       }
     *     }]
     *   }
     * });
     * ```
     */
    static async get(map: TomTomMap, config?: StyleModuleInitConfig & FlowConfig): Promise<TrafficFlowModule> {
        await prepareForModuleInit(map, config?.ensureAddedToStyle, TRAFFIC_FLOW_SOURCE_ID, 'trafficFlow');
        return new TrafficFlowModule(map, config);
    }

    private constructor(map: TomTomMap, config?: FlowConfig) {
        super('style', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const flowSource = this.mapLibreMap.getSource(TRAFFIC_FLOW_SOURCE_ID);
        if (!flowSource) {
            throw notInTheStyle(`init ${TrafficFlowModule.name} with source ID ${TRAFFIC_FLOW_SOURCE_ID}`);
        }
        this.originalFilters = {};
        for (const layer of this.getLayers()) {
            this.originalFilters[layer.id] = layer.filter;
        }
        return { trafficFlow: new StyleSourceWithLayers(this.mapLibreMap, flowSource) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: FlowConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        this._filter(config?.filters, false);
        return config;
    }

    private getLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [TRAFFIC_FLOW_SOURCE_ID]);
    }

    /**
     * Applies filters to traffic flow display.
     *
     * @param filters - Filter configuration for road types, categories, and closures.
     * Pass `undefined` to reset to defaults (show all).
     *
     * @remarks
     * **Filter Options:**
     * - `roadCategories`: Filter by road importance (motorway, trunk, primary, etc.)
     * - `roadSubCategories`: Filter by specific street types
     * - `showRoadClosures`: Show only closures or exclude them
     *
     * **Available Road Categories:**
     * - `motorway`: Major highways
     * - `trunk`: Major roads
     * - `primary`: Primary roads
     * - `secondary`: Secondary roads
     * - `tertiary`: Tertiary roads
     * - `street`: Local streets
     *
     * **Filter Logic:**
     * Uses "any" (OR) logic - traffic matching any filter is shown.
     *
     * @example
     * Show only major roads:
     * ```typescript
     * trafficFlow.filter({
     *   any: [{
     *     roadCategories: {
     *       show: 'only',
     *       values: ['motorway', 'trunk', 'primary']
     *     }
     *   }]
     * });
     * ```
     *
     * @example
     * Hide street-level traffic:
     * ```typescript
     * trafficFlow.filter({
     *   any: [{
     *     roadCategories: {
     *       show: 'all_except',
     *       values: ['street']
     *     }
     *   }]
     * });
     * ```
     *
     * @example
     * Multiple filter criteria:
     * ```typescript
     * trafficFlow.filter({
     *   any: [
     *     {
     *       roadCategories: { show: 'only', values: ['motorway'] }
     *     },
     *     {
     *       showRoadClosures: 'only'
     *     }
     *   ]
     * });
     * ```
     *
     * @example
     * Reset filters:
     * ```typescript
     * trafficFlow.filter(undefined);
     * ```
     */
    filter(filters?: TrafficFlowFilters) {
        this._filter(filters);
    }

    private _filter(filters: TrafficFlowFilters | undefined, updateConfig = true) {
        if (this.tomtomMap.mapReady) {
            if (filters?.any?.length) {
                const filterExpression = buildMapLibreFlowFilters(filters);
                if (filterExpression) {
                    applyFilter(filterExpression, this.getLayers(), this.mapLibreMap, this.originalFilters);
                }
            } else if (this.config?.filters?.any?.length) {
                applyFilter(undefined, this.getLayers(), this.mapLibreMap, this.originalFilters);
            }
        }

        if (updateConfig) {
            this.config = omitBy(
                {
                    ...this.config,
                    filters: filters,
                },
                isNil,
            );
        }
    }

    /**
     * Sets the visibility of traffic flow layers.
     *
     * @param visible - `true` to show traffic flow, `false` to hide it.
     *
     * @example
     * ```typescript
     * trafficFlow.setVisible(true);  // Show traffic
     * trafficFlow.setVisible(false); // Hide traffic
     * ```
     */
    setVisible(visible: boolean): void {
        this.config = { ...this.config, visible };
        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.trafficFlow.setLayersVisible(visible);
        }
    }

    /**
     * Returns if any layer for traffic flow is visible or not.
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.trafficFlow.isAnyLayerVisible();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.trafficFlow);
    }
}
