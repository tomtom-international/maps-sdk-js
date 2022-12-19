import isNil from "lodash/isNil";
import { AbstractMapModule, LayerSpecFilter, StyleSourceWithLayers } from "../core";
import { VectorTilesTrafficConfig } from ".";
import { changingWhileNotInTheStyle } from "../core/ErrorMessages";
import { EventModule } from "../core/EventModule";

export const VECTOR_TILES_INCIDENTS_SOURCE_ID = "vectorTilesIncidents";
export const VECTOR_TILES_FLOW_SOURCE_ID = "vectorTilesFlow";

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic sources and layers.
 */
export class VectorTilesTraffic extends AbstractMapModule<VectorTilesTrafficConfig> {
    private incidents?: StyleSourceWithLayers;
    private flow?: StyleSourceWithLayers;

    protected init(config?: VectorTilesTrafficConfig): void {
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
        }
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
        this.callWhenMapReady(() => {
            if (this.incidents) {
                this.incidents.setAllLayersVisible(visible, filter);
            } else {
                console.error(changingWhileNotInTheStyle("traffic incidents visibility"));
            }
        });
    }

    setIncidentIconsVisible(visible: boolean): void {
        this.setIncidentsVisible(visible, (layerSpec) => layerSpec.type === "symbol");
    }

    setFlowVisible(visible: boolean): void {
        this.callWhenMapReady(() => {
            if (this.flow) {
                this.flow.setAllLayersVisible(visible);
            } else {
                console.error(changingWhileNotInTheStyle("traffic flow visibility"));
            }
        });
    }

    get events() {
        return {
            incidents: new EventModule(this.goSDKMap._eventsProxy, this.incidents),
            flow: new EventModule(this.goSDKMap._eventsProxy, this.flow)
        };
    }
}
