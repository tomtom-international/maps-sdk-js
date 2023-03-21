import { GeometryDataResponse } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    GEOMETRY_SOURCE_ID,
    SourceWithLayerIDs
} from "../shared";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";

const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";

/**
 * IDs of sources and layers for geometry module.
 */
export type GeometryModuleSourcesAndLayersIds = {
    /**
     * Geometry source id with corresponding layers ids.
     */
    geometry: SourceWithLayerIDs;
};

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleSourcesAndLayersIds, GeometryModuleConfig> {
    private geometry!: GeoJSONSourceWithLayers<GeometryDataResponse>;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: GeometryModuleConfig): Promise<GeometryModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new GeometryModule(tomtomMap, config);
    }

    protected initSourcesWithLayers() {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID },
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID }
        ]);
        return {
            geometry: { sourceID: GEOMETRY_SOURCE_ID, layerIDs: [GEOMETRY_FILL_LAYER_ID, GEOMETRY_OUTLINE_LAYER_ID] }
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected _applyConfig() {}

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
        return new EventsModule(this.tomtomMap._eventsProxy, this.geometry);
    }
}
