import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    LayerSpecWithSource,
    StyleModuleInitConfig,
    StyleSourceWithLayers,
    TRAFFIC_FLOW_SOURCE_ID
} from "../shared";
import { FlowConfig, TrafficFlowFilters } from "./types/trafficModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { prepareForModuleInit } from "../shared/mapUtils";
import { notInTheStyle } from "../shared/errorMessages";
import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { applyFilter, buildMapLibreFlowFilters } from "./filters/trafficFilters";
import omitBy from "lodash/omitBy";

/**
 * IDs of sources and layers for traffic flow module.
 */
type TrafficFlowSourcesWithLayers = {
    trafficFlow: StyleSourceWithLayers;
};

/**
 * Vector tiles traffic flow module.
 * * Traffic flow refers to the vector traffic flow layers.
 */
export class TrafficFlowModule extends AbstractMapModule<TrafficFlowSourcesWithLayers, FlowConfig> {
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Gets the Traffic Flow Module for the given TomTomMap and configuration once the map is ready.
     * @param map The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(map: TomTomMap, config?: StyleModuleInitConfig & FlowConfig): Promise<TrafficFlowModule> {
        await prepareForModuleInit(map, config?.ensureAddedToStyle, TRAFFIC_FLOW_SOURCE_ID, "trafficFlow");
        return new TrafficFlowModule(map, config);
    }

    private constructor(map: TomTomMap, config?: FlowConfig) {
        super("style", map, config);
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
     * Applies the given filters to traffic flow.
     * * Any other configurations remain untouched.
     * @param filters The filters to apply. If undefined, defaults will be ensured.
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
                    filters: filters
                },
                isNil
            );
        }
    }

    /**
     * Sets visibility for traffic flow layers.
     * @param visible
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
