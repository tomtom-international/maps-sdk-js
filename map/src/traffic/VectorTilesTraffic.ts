import { FilterSpecification, LayerSpecification } from "maplibre-gl";
import isNil from "lodash/isNil";
import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    LayerSpecFilter,
    LayerSpecWithSource,
    MultiSyntaxFilter,
    SourceWithLayers,
    StyleSourceWithLayers,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "../core";
import { IncidentsCommonConfig, VectorTilesTrafficConfig } from ".";
import { notInTheStyle } from "../core/ErrorMessages";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { buildMapLibreFlowFilters, buildMapLibreIncidentFilters } from "./filters/TrafficFilters";
import { getMergedAllFilter } from "../core/MapLibreUtils";

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic sources and layers.
 */
export class VectorTilesTraffic extends AbstractMapModule<VectorTilesTrafficConfig> {
    private incidents?: StyleSourceWithLayers;
    private flow?: StyleSourceWithLayers;
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: VectorTilesTrafficConfig): Promise<VectorTilesTraffic> {
        await waitUntilMapIsReady(goSDKMap);
        return new VectorTilesTraffic(goSDKMap, config);
    }

    protected initSourcesWithLayers() {
        const incidentsRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_INCIDENTS_SOURCE_ID);
        if (incidentsRuntimeSource) {
            this.incidents = new StyleSourceWithLayers(this.mapLibreMap, incidentsRuntimeSource);
        }

        const flowRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_FLOW_SOURCE_ID);
        if (flowRuntimeSource) {
            this.flow = new StyleSourceWithLayers(this.mapLibreMap, flowRuntimeSource);
        }

        if (incidentsRuntimeSource || flowRuntimeSource) {
            this.originalFilters = {};
            for (const layer of filterLayersBySources(this.goSDKMap.mapLibreMap, [
                VECTOR_TILES_INCIDENTS_SOURCE_ID,
                VECTOR_TILES_FLOW_SOURCE_ID
            ])) {
                this.originalFilters[layer.id] = layer.filter;
            }
        } else {
            throw notInTheStyle(
                `init ${VectorTilesTraffic.name} with at least one of these source IDs: 
                ${VECTOR_TILES_INCIDENTS_SOURCE_ID} ${VECTOR_TILES_FLOW_SOURCE_ID}`
            );
        }
    }

    protected _applyConfig(config: VectorTilesTrafficConfig | null): void {
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        this.applyIncidentsConfig(config);
        this.applyFlowConfig(config);
    }

    private applyIncidentsConfig(config: VectorTilesTrafficConfig | null) {
        const incidents = config?.incidents;
        if (incidents && !isNil(incidents.visible)) {
            this.setIncidentsVisible(incidents.visible);
        } else if (isNil(config?.visible) && !this.isIncidentsVisible()) {
            // applying default
            this.setIncidentsVisible(true);
        }

        if (incidents?.filters?.any?.length) {
            const incidentsFilterExpression = buildMapLibreIncidentFilters(incidents.filters);
            if (incidentsFilterExpression) {
                const layers = incidents.icons?.filters ? this.getIncidentNonSymbolLayers() : this.getIncidentLayers();
                this.applyFilter(incidentsFilterExpression, layers);
            }
        } else if (this.config?.incidents?.filters?.any?.length) {
            this.applyDefaultFilter(this.getIncidentLayers());
        }

        incidents?.icons && this.applyIncidentIconsConfig(incidents.icons);

        if (incidents?.interactive) {
            this.goSDKMap._eventsProxy.ensureAdded(this.incidents as SourceWithLayers);
        }
    }

    private applyIncidentIconsConfig(icons: IncidentsCommonConfig) {
        if (!isNil(icons.visible)) {
            this.setIncidentIconsVisible(icons.visible);
        }
        // else: default incidents visibility has been set already if necessary

        if (icons.filters?.any?.length) {
            const iconsFilterExpression = buildMapLibreIncidentFilters(icons.filters);
            if (iconsFilterExpression) {
                this.applyFilter(iconsFilterExpression, this.getIncidentSymbolLayers());
            }
        }
        // else: default incident filters have been set already if necessary
    }

    private applyFlowConfig(config: VectorTilesTrafficConfig | null) {
        const flow = config?.flow;
        if (flow && !isNil(flow.visible)) {
            this.setFlowVisible(flow.visible);
        } else if (isNil(config?.visible) && !this.isFlowVisible()) {
            // applying default:
            this.setFlowVisible(true);
        }

        if (flow?.filters?.any?.length) {
            const flowFilterExpression = buildMapLibreFlowFilters(flow.filters);
            if (flowFilterExpression) {
                this.applyFilter(flowFilterExpression, this.getFlowLayers());
            }
        } else if (this.config?.incidents?.filters?.any?.length) {
            this.applyDefaultFilter(this.getFlowLayers());
        }

        if (flow?.interactive) {
            this.goSDKMap._eventsProxy.ensureAdded(this.flow as SourceWithLayers);
        }
    }

    private getIncidentLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.goSDKMap.mapLibreMap, [VECTOR_TILES_INCIDENTS_SOURCE_ID]);
    }

    private getIncidentSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type == "symbol");
    }

    private getIncidentNonSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type != "symbol");
    }

    private getFlowLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.goSDKMap.mapLibreMap, [VECTOR_TILES_FLOW_SOURCE_ID]);
    }

    private applyFilter(filter: MultiSyntaxFilter, layers: LayerSpecification[]) {
        for (const layer of layers) {
            this.mapLibreMap.setFilter(layer.id, getMergedAllFilter(filter, this.originalFilters[layer.id]));
        }
    }

    private applyDefaultFilter(layers: LayerSpecification[]) {
        for (const layer of layers) {
            this.mapLibreMap.setFilter(layer.id, this.originalFilters[layer.id]);
        }
    }

    isVisible(): boolean {
        return this.isIncidentsVisible() || this.isFlowVisible();
    }

    isIncidentsVisible(): boolean {
        return !!this.incidents?.isAnyLayerVisible();
    }

    isIncidentIconsVisible(): boolean {
        return !!this.incidents?.isAnyLayerVisible((layerSpec) => layerSpec.type === "symbol");
    }

    isFlowVisible(): boolean {
        return !!this.flow?.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        this.setIncidentsVisible(visible);
        this.setFlowVisible(visible);
    }

    setIncidentsVisible(visible: boolean, filter?: LayerSpecFilter): void {
        if (this.incidents) {
            this.incidents.setAllLayersVisible(visible, filter);
        }
    }

    setIncidentIconsVisible(visible: boolean): void {
        this.setIncidentsVisible(visible, (layerSpec) => layerSpec.type === "symbol");
    }

    setFlowVisible(visible: boolean): void {
        if (this.flow) {
            this.flow.setAllLayersVisible(visible);
        }
    }

    /**
     * Create the events on/off for this module
     * @returns An object with instances of EventsModule for each layer
     */
    get events() {
        return {
            incidents: new EventsModule(this.goSDKMap._eventsProxy, this.incidents),
            flow: new EventsModule(this.goSDKMap._eventsProxy, this.flow)
        };
    }
}
