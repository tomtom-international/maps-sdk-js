import {
    AbstractMapModule,
    EventsModule,
    filterLayersBySources,
    LayerSpecWithSource,
    StyleModuleInitConfig,
    StyleSourceWithLayers,
    TRAFFIC_INCIDENTS_SOURCE_ID
} from "../shared";
import { IncidentsConfig, TrafficIncidentsFilters } from "./types/trafficModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { prepareForModuleInit } from "../shared/mapUtils";
import { notInTheStyle } from "../shared/errorMessages";
import isNil from "lodash/isNil";
import { FilterSpecification } from "maplibre-gl";
import { applyFilter, buildMapLibreIncidentFilters } from "./filters/trafficFilters";
import omitBy from "lodash/omitBy";
import isEmpty from "lodash/isEmpty";

/**
 * IDs of sources and layers for traffic incidents module.
 */
type TrafficIncidentsSourcesWithLayers = {
    trafficIncidents: StyleSourceWithLayers;
};

/**
 * Vector tiles traffic incidents module.
 * * Traffic incidents refers to the vector traffic incidents layers.
 */
export class TrafficIncidentsModule extends AbstractMapModule<TrafficIncidentsSourcesWithLayers, IncidentsConfig> {
    private originalFilters!: Record<string, FilterSpecification | undefined>;

    /**
     * Gets the Traffic incidents Module for the given TomTomMap and configuration once the map is ready.
     * @param map The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(
        map: TomTomMap,
        config?: StyleModuleInitConfig & IncidentsConfig
    ): Promise<TrafficIncidentsModule> {
        await prepareForModuleInit(map, config?.ensureAddedToStyle, TRAFFIC_INCIDENTS_SOURCE_ID, "trafficIncidents");
        return new TrafficIncidentsModule(map, config);
    }

    private constructor(map: TomTomMap, config?: IncidentsConfig) {
        super(map, config);
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
        if (config && !isNil(config.visible)) {
            this.setVisible(config.visible);
        } else if (!this._initializing && !this.isVisible()) {
            // applying default:
            this.setVisible(true);
        }
        if (config?.icons && !isNil(config.icons.visible)) {
            this.setIconsVisible(config.icons.visible);
        }
        this._filter(config?.filters, config?.icons?.filters, false);
        return config;
    }

    /**
     * Applies the given filters to traffic incidents.
     * * Any other configurations remain untouched.
     * @param incidentFilters The incident filters to apply. If undefined, defaults will be ensured.
     * @param iconFilters The icon filters to apply. If undefined, defaults will be ensured.
     */
    filter(incidentFilters?: TrafficIncidentsFilters, iconFilters?: TrafficIncidentsFilters) {
        this._filter(incidentFilters, iconFilters);
    }

    private _filter(
        incidentFilters: TrafficIncidentsFilters | undefined,
        iconFilters: TrafficIncidentsFilters | undefined,
        updateConfig = true
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
                    icons: { ...this.config?.icons, filters: iconFilters }
                },
                isNil
            );
        }
    }

    private getLayers(): LayerSpecWithSource[] {
        return filterLayersBySources(this.tomtomMap.mapLibreMap, [TRAFFIC_INCIDENTS_SOURCE_ID]);
    }

    private getSymbolLayers(): LayerSpecWithSource[] {
        return this.getLayers().filter((layer) => layer.type == "symbol");
    }

    private getNonSymbolLayers(): LayerSpecWithSource[] {
        return this.getLayers().filter((layer) => layer.type != "symbol");
    }

    /**
     * Sets the icon visibility for incidents.
     * @param visible
     */
    setIconsVisible(visible: boolean): void {
        if (this.sourcesWithLayers.trafficIncidents) {
            // We adjust the config for this change (but it might be overwritten if it's part of an "applyConfig" call)
            this.config = {
                ...this.config,
                icons: { ...this.config?.icons, visible }
            };

            if (this.tomtomMap.mapReady) {
                this.sourcesWithLayers.trafficIncidents.setLayersVisible(
                    visible,
                    (layerSpec) => layerSpec.type === "symbol"
                );
            }
        }
    }

    /**
     * Sets visibility for traffic incidents layers.
     * @param visible
     */
    setVisible(visible: boolean): void {
        delete this.config?.icons?.visible;
        this.config = { ...omitBy({ ...this.config }, isEmpty), visible };
        if (this.tomtomMap.mapReady) {
            this.sourcesWithLayers.trafficIncidents.setLayersVisible(visible);
        }
    }

    /**
     * Returns if any layer for traffic incidents is visible or not.
     */
    isVisible(): boolean {
        return this.sourcesWithLayers.trafficIncidents.isAnyLayerVisible();
    }

    /**
     * Returns whether any traffic incident symbol layers are visible.
     */
    anyIconLayersVisible(): boolean {
        return !!this.sourcesWithLayers.trafficIncidents?.isAnyLayerVisible((layerSpec) => layerSpec.type === "symbol");
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.trafficIncidents);
    }
}
