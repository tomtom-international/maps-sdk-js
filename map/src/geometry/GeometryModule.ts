import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, GEOMETRY_SOURCE_ID } from "../core";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";

const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleConfig> {
    private geometry: GeoJSONSourceWithLayers<GeometryDataResponse>;

    private constructor(goSDKMap: GOSDKMap, config?: GeometryModuleConfig) {
        super(goSDKMap, config);

        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID },
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID }
        ]);

        if (config?.interactive && this.geometry) {
            goSDKMap._eventsProxy.add(this.geometry);
        }
    }

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
