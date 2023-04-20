import { FilterSpecification, LayerSpecification } from "maplibre-gl";
import isNil from "lodash/isNil";
import omitBy from "lodash/omitBy";
import isEmpty from "lodash/isEmpty";
import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    LayerSpecWithSource,
    MultiSyntaxFilter,
    StyleSourceWithLayers,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "../shared";
import { TrafficFlowFilters, TrafficIncidentsFilters, TrafficModuleConfig } from ".";
import { notInTheStyle } from "../shared/ErrorMessages";
import { TomTomMap } from "../TomTomMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { buildMapLibreFlowFilters, buildMapLibreIncidentFilters } from "./filters/TrafficFilters";
import { getMergedAllFilter } from "../shared/MapLibreFilterUtils";

type ChangeOptions = {
    updateConfig: boolean;
};

type TrafficSourcesAndLayers = {
    incidents?: StyleSourceWithLayers;
    flow?: StyleSourceWithLayers;
};

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic layers which are present in the map style.
 */
export class TrafficModule extends AbstractMapModule<TrafficSourcesAndLayers, TrafficModuleConfig> {
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Gets the Traffic Module for the given TomTomMap and configuration once the map is ready.
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: TrafficModuleConfig): Promise<TrafficModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new TrafficModule(tomtomMap, config);
    }

    protected _initSourcesWithLayers(): TrafficSourcesAndLayers {
        const incidentsRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_INCIDENTS_SOURCE_ID);
        let incidents: StyleSourceWithLayers | undefined;
        if (incidentsRuntimeSource) {
            incidents = new StyleSourceWithLayers(this.mapLibreMap, incidentsRuntimeSource);
        }

        let flow: StyleSourceWithLayers | undefined;
        const flowRuntimeSource = this.mapLibreMap.getSource(VECTOR_TILES_FLOW_SOURCE_ID);
        if (flowRuntimeSource) {
            flow = new StyleSourceWithLayers(this.mapLibreMap, flowRuntimeSource);
        }

        if (!incidentsRuntimeSource && !flowRuntimeSource) {
            throw notInTheStyle(
                `init ${TrafficModule.name} with at least one of these source IDs: 
                ${VECTOR_TILES_INCIDENTS_SOURCE_ID} ${VECTOR_TILES_FLOW_SOURCE_ID}`
            );
        }
        // else
        this.originalFilters = {};
        for (const layer of filterLayersBySources(this.tomtomMap.mapLibreMap, [
            VECTOR_TILES_INCIDENTS_SOURCE_ID,
            VECTOR_TILES_FLOW_SOURCE_ID
        ])) {
            this.originalFilters[layer.id] = layer.filter;
        }
        return { ...(incidents && { incidents }), ...(flow && { flow }) };
    }

    protected _applyConfig(config: TrafficModuleConfig | undefined) {
        if (config && !isNil(config.visible)) {
            this._setVisible(config.visible, { updateConfig: false });
        } else if (!this.anyLayersVisible()) {
            // applying default:
            this._setVisible(true, { updateConfig: false });
        }
        this.applyIncidentsConfig(config);
        this.applyFlowConfig(config);
        return config;
    }

    private applyIncidentsConfig(config: TrafficModuleConfig | undefined) {
        const incidents = config?.incidents;

        if (incidents && !isNil(incidents.visible)) {
            this._setIncidentsVisible(incidents.visible, { updateConfig: false });
        } else if (isNil(config?.visible) && !this.sourcesWithLayers.incidents?.areAllLayersVisible()) {
            // applying default
            this._setIncidentsVisible(true, { updateConfig: false });
        }
        if (incidents?.icons && !isNil(incidents.icons.visible)) {
            this.setIncidentIconsVisible(incidents.icons.visible);
        }
        // else: default incidents visibility has been set already if necessary

        this._filterIncidents(incidents?.filters, incidents?.icons?.filters, { updateConfig: false });
    }

    /**
     * Applies the given filters to traffic incidents, and optionally also icons.
     * * Any other configurations remain untouched.
     * @param incidentFilters The filters to apply to all incident layers, unless icon filters are supplied for the symbol ones.
     * If undefined, defaults will be ensured.
     * @param iconFilters If specified, symbol layers will get these filters instead of incidentFilters.
     */
    filterIncidents(incidentFilters?: TrafficIncidentsFilters, iconFilters?: TrafficIncidentsFilters) {
        this._filterIncidents(incidentFilters, iconFilters, { updateConfig: true });
    }

    private _filterIncidents(
        incidentFilters: TrafficIncidentsFilters | undefined,
        iconFilters: TrafficIncidentsFilters | undefined,
        options: ChangeOptions
    ) {
        if (incidentFilters?.any?.length) {
            const incidentsFilterExpression = buildMapLibreIncidentFilters(incidentFilters);
            if (incidentsFilterExpression) {
                const layers = iconFilters ? this.getIncidentNonSymbolLayers() : this.getIncidentLayers();
                this.applyFilter(incidentsFilterExpression, layers);
            }
        } else if (this.config?.incidents?.filters?.any?.length) {
            this.applyDefaultFilter(this.getIncidentLayers());
        }

        this.filterIncidentIcons(iconFilters);

        if (options.updateConfig) {
            this.config = omitBy(
                {
                    ...this.config,
                    incidents: {
                        ...this.config?.incidents,
                        filters: incidentFilters,
                        icons: { ...this.config?.incidents?.icons, filters: iconFilters }
                    }
                },
                isNil
            );
        }
    }

    private filterIncidentIcons(iconsFilters?: TrafficIncidentsFilters) {
        if (iconsFilters?.any?.length) {
            const iconsFilterExpression = buildMapLibreIncidentFilters(iconsFilters);
            if (iconsFilterExpression) {
                this.applyFilter(iconsFilterExpression, this.getIncidentSymbolLayers());
            }
        }
        // else: default incident filters have been set already if necessary
    }

    private applyFlowConfig(config: TrafficModuleConfig | undefined) {
        const flow = config?.flow;
        if (flow && !isNil(flow.visible)) {
            this._setFlowVisible(flow.visible, { updateConfig: false });
        } else if (isNil(config?.visible) && !this.sourcesWithLayers.flow?.areAllLayersVisible()) {
            // applying default:
            this._setFlowVisible(true, { updateConfig: false });
        }

        this._filterFlow(flow?.filters, { updateConfig: false });
    }

    /**
     * Applies the given filters to traffic flow.
     * * Any other configurations remain untouched.
     * @param flowFilters The filters to apply. If undefined, defaults will be ensured.
     */
    filterFlow(flowFilters?: TrafficFlowFilters) {
        this._filterFlow(flowFilters, { updateConfig: true });
    }

    private _filterFlow(flowFilters: TrafficFlowFilters | undefined, options: ChangeOptions) {
        if (flowFilters?.any?.length) {
            const flowFilterExpression = buildMapLibreFlowFilters(flowFilters);
            if (flowFilterExpression) {
                this.applyFilter(flowFilterExpression, this.getFlowLayers());
            }
        } else if (this.config?.flow?.filters?.any?.length) {
            this.applyDefaultFilter(this.getFlowLayers());
        }

        if (options.updateConfig) {
            this.config = omitBy(
                {
                    ...this.config,
                    flow: {
                        ...this.config?.flow,
                        filters: flowFilters
                    }
                },
                isNil
            );
        }
    }

    private getIncidentLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [VECTOR_TILES_INCIDENTS_SOURCE_ID]);
    }

    private getIncidentSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type == "symbol");
    }

    private getIncidentNonSymbolLayers(): LayerSpecWithSource[] {
        return this.getIncidentLayers().filter((layer) => layer.type != "symbol");
    }

    private getFlowLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [VECTOR_TILES_FLOW_SOURCE_ID]);
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

    /**
     * Returns whether any traffic layers are visible.
     */
    anyLayersVisible(): boolean {
        return this.anyIncidentLayersVisible() || this.anyFlowLayersVisible();
    }

    /**
     * Returns whether any traffic incident layers are visible.
     */
    anyIncidentLayersVisible(): boolean {
        return !!this.sourcesWithLayers.incidents?.isAnyLayerVisible();
    }

    /**
     * Returns whether any traffic incident symbol layers are visible.
     */
    anyIncidentIconLayersVisible(): boolean {
        return !!this.sourcesWithLayers.incidents?.isAnyLayerVisible((layerSpec) => layerSpec.type === "symbol");
    }

    /**
     * Returns whether any traffic flow layers are visible.
     */
    anyFlowLayersVisible(): boolean {
        return !!this.sourcesWithLayers.flow?.isAnyLayerVisible();
    }

    setVisible(visible: boolean): void {
        this._setVisible(visible, { updateConfig: true });
    }

    private _setVisible(visible: boolean, options: ChangeOptions): void {
        this._setIncidentsVisible(visible, { updateConfig: false });
        this._setFlowVisible(visible, { updateConfig: false });
        if (options.updateConfig) {
            delete this.config?.incidents?.visible;
            delete this.config?.incidents?.icons?.visible;
            delete this.config?.flow?.visible;
            this.config = { ...omitBy({ ...this.config }, isEmpty), visible };
        }
    }

    setIncidentsVisible(visible: boolean): void {
        this._setIncidentsVisible(visible, { updateConfig: true });
    }

    private _setIncidentsVisible(visible: boolean, options: ChangeOptions): void {
        if (this.sourcesWithLayers.incidents) {
            this.sourcesWithLayers.incidents.setAllLayersVisible(visible);
            if (options.updateConfig) {
                delete this.config?.incidents?.icons?.visible;
                this.config = {
                    ...this.config,
                    incidents: {
                        ...omitBy(this.config?.incidents, isEmpty),
                        visible
                    }
                };
            }
        }
    }

    setIncidentIconsVisible(visible: boolean): void {
        if (this.sourcesWithLayers.incidents) {
            this.sourcesWithLayers.incidents.setAllLayersVisible(visible, (layerSpec) => layerSpec.type === "symbol");
            // We adjust the config for this change (but it might be overwritten if it's part of an "applyConfig" call)
            this.config = {
                ...this.config,
                incidents: { ...this.config?.incidents, icons: { ...this.config?.incidents?.icons, visible } }
            };
        }
    }

    setFlowVisible(visible: boolean): void {
        this._setFlowVisible(visible, { updateConfig: true });
    }

    private _setFlowVisible(visible: boolean, options: ChangeOptions): void {
        if (this.sourcesWithLayers.flow) {
            this.sourcesWithLayers.flow.setAllLayersVisible(visible);
            if (options.updateConfig) {
                this.config = { ...this.config, flow: { ...this.config?.flow, visible } };
            }
        }
    }

    /**
     * Create the events on/off for this module.
     * * If either incidents or flow were excluded from the style, their events object will be undefined.
     * @returns An object with instances of EventsModule for each layer
     */
    get events() {
        return {
            incidents: new EventsModule(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.incidents as StyleSourceWithLayers
            ),
            flow: new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.flow as StyleSourceWithLayers)
        };
    }
}
