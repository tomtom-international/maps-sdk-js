import isNil from "lodash/isNil";
import {
    AbstractMapModule,
    filterLayersBySource,
    goSDKSourceFromRuntime,
    LayerSpecFilter,
    SourceWithLayers
} from "../core";
import { VectorTilesTrafficConfig } from ".";

export const incidentsSourceID = "vectorTilesIncidents";
export const flowSourceID = "vectorTilesFlow";

/**
 * Vector tiles traffic module.
 * * Controls both incidents and flow vector traffic sources and layers.
 */
export class VectorTilesTraffic extends AbstractMapModule<VectorTilesTrafficConfig> {
    private incidents?: SourceWithLayers;
    private flow?: SourceWithLayers;

    protected init(config?: VectorTilesTrafficConfig): void {
        const incidentsRuntimeSource = this.mapLibreMap.getSource(incidentsSourceID);
        if (incidentsRuntimeSource) {
            this.incidents = new SourceWithLayers(
                this.mapLibreMap,
                goSDKSourceFromRuntime(incidentsRuntimeSource),
                filterLayersBySource(this.mapLibreMap, incidentsSourceID)
            );
        }

        const flowRuntimeSource = this.mapLibreMap.getSource(flowSourceID);
        if (flowRuntimeSource) {
            this.flow = new SourceWithLayers(
                this.mapLibreMap,
                goSDKSourceFromRuntime(flowRuntimeSource),
                filterLayersBySource(this.mapLibreMap, flowSourceID)
            );
        }

        if (config) {
            this.applyConfig(config);
        }
    }

    public applyConfig(config: VectorTilesTrafficConfig): void {
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

    public isVisible(): boolean {
        return this.isIncidentsVisible() || this.isFlowVisible();
    }

    public isIncidentsVisible(): boolean {
        return !!this.incidents?.isAnyLayerVisible();
    }

    public isIncidentIconsVisible(): boolean {
        return !!this.incidents?.isAnyLayerVisible((layerSpec) => layerSpec.type === "symbol");
    }

    public isFlowVisible(): boolean {
        return !!this.flow?.isAnyLayerVisible();
    }

    public toggleVisibility(): void {
        this.setVisible(!this.isVisible());
    }

    public toggleIncidentsVisibility(): void {
        this.setIncidentsVisible(!this.isIncidentsVisible());
    }

    public toggleIncidentIconsVisibility(): void {
        this.setIncidentIconsVisible(!this.isIncidentIconsVisible());
    }

    public toggleFlowVisibility(): void {
        this.setFlowVisible(!this.isFlowVisible());
    }

    public setVisible(visible: boolean): void {
        this.setIncidentsVisible(visible);
        this.setFlowVisible(visible);
    }

    public setIncidentsVisible(visible: boolean, filter?: LayerSpecFilter): void {
        if (this.incidents) {
            this.incidents.setAllLayersVisible(visible, filter);
        } else {
            console.error(
                "Trying to change traffic incidents visibility while they are not in the map style. " +
                    "Is the map style not loaded yet, or did you exclude incidents when loading the map?"
            );
        }
    }

    public setIncidentIconsVisible(visible: boolean): void {
        this.setIncidentsVisible(visible, (layerSpec) => layerSpec.type === "symbol");
    }

    public setFlowVisible(visible: boolean): void {
        if (this.flow) {
            this.flow.setAllLayersVisible(visible);
        } else {
            console.error(
                "Trying to change traffic flow visibility while they are not in the map style. " +
                    "Is the map style not loaded yet, or did you exclude flow when loading the map?"
            );
        }
    }
}
