import { FilterSpecification } from "maplibre-gl";
import isNil from "lodash/isNil";
import {
    AbstractMapModule,
    EventsModule,
    LayerSpecFilter,
    LayerSpecWithSource,
    MultiSyntaxFilter,
    StyleSourceWithLayers,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "../core";
import { FlowConfig, IncidentsCommonConfig, IncidentsConfig, VectorTilesTrafficConfig } from ".";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { buildMapLibreFlowFilters, buildMapLibreIncidentFilters } from "./filters/TrafficFilters";
import { getMergedAllFilter } from "../core/MapLibreUtils";

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic sources and layers.
 */
export class VectorTilesTraffic extends AbstractMapModule<VectorTilesTrafficConfig> {
    private readonly incidents?: StyleSourceWithLayers;
    private readonly flow?: StyleSourceWithLayers;
    private readonly originalFilters: Record<string, FilterSpecification | undefined> = {};

    private constructor(goSDKMap: GOSDKMap, config?: VectorTilesTrafficConfig) {
        super(goSDKMap, config);

        const incidentsRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_INCIDENTS_SOURCE_ID);
        if (incidentsRuntimeSource) {
            this.incidents = new StyleSourceWithLayers(this.mapLibreMap, incidentsRuntimeSource);
        }

        const flowRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_FLOW_SOURCE_ID);
        if (flowRuntimeSource) {
            this.flow = new StyleSourceWithLayers(this.mapLibreMap, flowRuntimeSource);
        }

        if (incidentsRuntimeSource || flowRuntimeSource) {
            for (const layer of this.getLayers([VECTOR_TILES_INCIDENTS_SOURCE_ID, VECTOR_TILES_FLOW_SOURCE_ID])) {
                this.originalFilters[layer.id] = layer.filter;
            }
        }

        if (config) {
            this.applyConfig(config);

            if (config.flow?.interactive && this.flow) {
                goSDKMap._eventsProxy.add(this.flow);
            }

            if (config.incidents?.interactive && this.incidents) {
                goSDKMap._eventsProxy.add(this.incidents);
            }
        }
    }

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

    applyConfig(config: VectorTilesTrafficConfig): void {
        if (!isNil(config.visible)) {
            this.setVisible(config.visible);
        }
        config.incidents && this.applyIncidentsConfig(config.incidents);
        config.flow && this.applyFlowConfig(config.flow);
    }

    private applyIncidentsConfig(incidents: IncidentsConfig) {
        if (!isNil(incidents.visible)) {
            this.setIncidentsVisible(incidents.visible);
        }

        if (incidents.filters?.any?.length) {
            const incidentsFilterExpression = buildMapLibreIncidentFilters(incidents.filters);
            if (incidentsFilterExpression) {
                const layers = incidents.icons?.filters ? this.getIncidentNonSymbolLayers() : this.getIncidentLayers();
                for (const layer of layers) {
                    this.applyFilter(layer.id, incidentsFilterExpression);
                }
            }
        }

        incidents.icons && this.applyIncidentIconsConfig(incidents.icons);
    }

    private applyIncidentIconsConfig(icons: IncidentsCommonConfig) {
        if (!isNil(icons.visible)) {
            this.setIncidentIconsVisible(icons.visible);
        }
        if (icons.filters?.any?.length) {
            const iconsFilterExpression = buildMapLibreIncidentFilters(icons.filters);
            if (iconsFilterExpression) {
                for (const layer of this.getIncidentSymbolLayers()) {
                    this.applyFilter(layer.id, iconsFilterExpression);
                }
            }
        }
    }

    private applyFlowConfig(flow: FlowConfig) {
        if (!isNil(flow.visible)) {
            this.setFlowVisible(flow.visible);
        }

        if (flow.filters?.any?.length) {
            const flowFilterExpression = buildMapLibreFlowFilters(flow.filters);
            if (flowFilterExpression) {
                for (const layer of this.getFlowLayers()) {
                    this.applyFilter(layer.id, flowFilterExpression);
                }
            }
        }
    }

    private getLayers(sources: (typeof VECTOR_TILES_INCIDENTS_SOURCE_ID | typeof VECTOR_TILES_FLOW_SOURCE_ID)[]) {
        return this.mapLibreMap
            .getStyle()
            .layers.filter((layer) =>
                (sources as string[]).includes((layer as LayerSpecWithSource).source)
            ) as LayerSpecWithSource[];
    }

    private getIncidentLayers(): LayerSpecWithSource[] {
        return this.getLayers([VECTOR_TILES_INCIDENTS_SOURCE_ID]);
    }

    private getIncidentSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type == "symbol");
    }

    private getIncidentNonSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type != "symbol");
    }

    private getFlowLayers(): LayerSpecWithSource[] {
        return this.getLayers([VECTOR_TILES_FLOW_SOURCE_ID]);
    }

    private applyFilter(layerID: string, filter: MultiSyntaxFilter) {
        this.mapLibreMap.setFilter(layerID, getMergedAllFilter(filter, this.originalFilters[layerID]));
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

    toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    toggleIncidentsVisibility(): void {
        this.setIncidentsVisible(!this.isIncidentsVisible());
    }

    toggleIncidentIconsVisibility(): void {
        this.setIncidentIconsVisible(!this.isIncidentIconsVisible());
    }

    toggleFlowVisibility(): void {
        this.setFlowVisible(!this.isFlowVisible());
    }

    setVisible(visible: boolean): void {
        this.setIncidentsVisible(visible);
        this.setFlowVisible(visible);
    }

    setIncidentsVisible(visible: boolean, filter?: LayerSpecFilter): void {
        if (this.incidents) {
            this.incidents.setAllLayersVisible(visible, filter);
        } else {
            console.error(changingWhileNotInTheStyle("traffic incidents visibility"));
        }
    }

    setIncidentIconsVisible(visible: boolean): void {
        this.setIncidentsVisible(visible, (layerSpec) => layerSpec.type === "symbol");
    }

    setFlowVisible(visible: boolean): void {
        if (this.flow) {
            this.flow.setAllLayersVisible(visible);
        } else {
            console.error(changingWhileNotInTheStyle("traffic flow visibility"));
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
