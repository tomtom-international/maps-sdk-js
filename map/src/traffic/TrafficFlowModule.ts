import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    LayerSpecWithSource,
    StyleModuleInitConfig,
    StyleSourceWithLayers,
    VECTOR_TILES_FLOW_SOURCE_ID
} from "../shared";
import { FlowConfig, TrafficFlowFilters } from "./types/TrafficModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { prepareForModuleInit } from "../shared/mapUtils";
import { notInTheStyle } from "../shared/ErrorMessages";
import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { applyFilter, buildMapLibreFlowFilters } from "./filters/TrafficFilters";
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
        await prepareForModuleInit(map, config?.ensureAddedToStyle, VECTOR_TILES_FLOW_SOURCE_ID, "traffic_flow");
        return new TrafficFlowModule(map, config);
    }

    private constructor(map: TomTomMap, config?: FlowConfig) {
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers() {
        const flowSource = this.mapLibreMap.getSource(VECTOR_TILES_FLOW_SOURCE_ID);
        if (!flowSource) {
            throw notInTheStyle(`init ${TrafficFlowModule.name} with source ID ${VECTOR_TILES_FLOW_SOURCE_ID}`);
        }
        this.originalFilters = {};
        for (const layer of filterLayersBySources(this.tomtomMap.mapLibreMap, [VECTOR_TILES_FLOW_SOURCE_ID])) {
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
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        this._filterFlow(config?.filters);
        return config;
    }

    private getFlowLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [VECTOR_TILES_FLOW_SOURCE_ID]);
    }

    /**
     * Applies the given filters to traffic flow.
     * * Any other configurations remain untouched.
     * @param flowFilters The filters to apply. If undefined, defaults will be ensured.
     */
    filterFlow(flowFilters?: TrafficFlowFilters) {
        this._filterFlow(flowFilters);
    }

    private _filterFlow(flowFilters: TrafficFlowFilters | undefined) {
        if (flowFilters?.any?.length) {
            const flowFilterExpression = buildMapLibreFlowFilters(flowFilters);
            if (flowFilterExpression) {
                applyFilter(flowFilterExpression, this.getFlowLayers(), this.mapLibreMap, this.originalFilters);
            }
        } else if (this.config?.filters?.any?.length) {
            applyFilter(undefined, this.getFlowLayers(), this.mapLibreMap, this.originalFilters);
        }

        this.config = omitBy(
            {
                ...this.config,
                filters: flowFilters
            },
            isNil
        );
    }

    setVisible(visible: boolean): void {
        this.sourcesWithLayers.trafficFlow.setAllLayersVisible(visible);
        this.config = {
            ...this.config,
            visible
        };
    }

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
