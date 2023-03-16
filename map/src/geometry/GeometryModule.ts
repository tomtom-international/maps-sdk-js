import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, GEOMETRY_SOURCE_ID } from "../shared";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import isNil from "lodash/isNil";

const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";

/**
 * Enabling access to geometry module sources and layers for easy customization.
 */
export type GeometryModuleSourcesWithLayers = {
    /**
     * Geometry source with corresponding layers.
     */
    geometrySourceWithLayers: GeoJSONSourceWithLayers<GeometryDataResponse>;
};

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleSourcesWithLayers, GeometryModuleConfig> {
    private geometry!: GeoJSONSourceWithLayers<GeometryDataResponse>;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: GeometryModuleConfig): Promise<GeometryModule> {
        await waitUntilMapIsReady(goSDKMap);
        return new GeometryModule(goSDKMap, config);
    }

    protected initSourcesWithLayers() {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID },
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID }
        ]);
        this._addModuleToEventsProxy(true);
        return { geometrySourceWithLayers: this.geometry };
    }

    protected _applyConfig(config: GeometryModuleConfig | undefined) {
        if (config && !isNil(config.interactive)) {
            this._addModuleToEventsProxy(config.interactive);
        }
    }

    private _addModuleToEventsProxy(interactive: boolean) {
        this.goSDKMap._eventsProxy.ensureAdded(this.geometry, interactive);
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     */
    show(geometry: GeometryDataResponse): void {
        this.geometry.show(geometry);
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.geometry.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.geometry);
    }
}
