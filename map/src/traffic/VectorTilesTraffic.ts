import isNil from "lodash/isNil";
import {
    AbstractMapModule,
    EventsModule,
    LayerSpecFilter,
    StyleSourceWithLayers,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "../core";
import { VectorTilesTrafficConfig } from ".";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic sources and layers.
 */
export class VectorTilesTraffic extends AbstractMapModule<VectorTilesTrafficConfig> {
    private incidents?: StyleSourceWithLayers;
    private flow?: StyleSourceWithLayers;

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
        if (config.incidents) {
            const incidents = config.incidents;
            if (!isNil(incidents.visible)) {
                this.setIncidentsVisible(incidents.visible);
            }
            if (incidents.icons) {
                const icons = incidents.icons;
                if (!isNil(icons.visible)) {
                    this.setIncidentIconsVisible(icons.visible);
                }
            }
        }
        if (config.flow) {
            const flow = config.flow;
            if (!isNil(flow.visible)) {
                this.setFlowVisible(flow.visible);
            }
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
    // @ts-ignore
    get events() {
        return {
            incidents: new EventsModule(this.goSDKMap._eventsProxy, this.incidents),
            flow: new EventsModule(this.goSDKMap._eventsProxy, this.flow)
        };
    }
}
