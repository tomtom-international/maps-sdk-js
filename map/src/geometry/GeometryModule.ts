import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers, EventsModule, EventsProxy } from "../core";
import { geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig, VectorTilesGeometryModuleConfig } from "./types/GeometryModuleConfig";
import { asDefined } from "../core/AssertionUtils";
import { GEOMETRY_SOURCE_ID } from "../core/layers/sourcesIDs";

const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleConfig> {
    private geometry?: GeoJSONSourceWithLayers<GeometryDataResponse>;

    init(eventsProxy: EventsProxy, config?: VectorTilesGeometryModuleConfig): void {
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID },
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID }
        ]);

        if (config?.interactive) {
            eventsProxy.add(this.geometry);
        }
    }

    protected loadLayersToEventProxy(event: EventsProxy): void {
        if (this.geometry) {
            event.add(this.geometry);
        }
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     */
    show(geometry: GeometryDataResponse): void {
        this.callWhenMapReady(() => asDefined(this.geometry).show(geometry));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => asDefined(this.geometry).clear());
    }

    /**
     * Create the events on/off for this module
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.geometry);
    }
}
