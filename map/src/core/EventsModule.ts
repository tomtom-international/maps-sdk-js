import { GeoJsonProperties, Geometry, Feature } from "geojson";
import { MapGeoJSONFeature } from "maplibre-gl";
import { EventsProxy } from "./EventsProxy";
import { EventType, HoverClickHandler, SourceWithLayers } from "./types";

export class EventsModule<T = MapGeoJSONFeature> {
    constructor(
        private eventProxy: EventsProxy,
        private mapModule?: SourceWithLayers,
        private mapToInternalFeature?: (
            rawFeature: MapGeoJSONFeature
        ) => Feature<Geometry, GeoJsonProperties> | undefined
    ) {}

    /**
     * Add Event to the EventProxy list
     * @private
     * @ignore
     */
    private addToEventProxy(type: EventType, handler: HoverClickHandler<MapGeoJSONFeature>) {
        if (this.mapModule) {
            this.eventProxy.addEventHandler(this.mapModule, handler, type);
        } else {
            console.error("mapModule can't be undefined.");
        }
    }

    /**
     * Remove Event to the EventProxy list
     * @private
     * @ignore
     */
    private removeFromEventProxy(type: EventType) {
        if (this.mapModule) {
            this.eventProxy.remove(type, this.mapModule);
        } else {
            console.error("mapModule can't be undefined.");
        }
    }

    /**
     * Add event handler of an event type
     * @param type
     * @param handler
     */
    on(type: EventType, handler: HoverClickHandler<T>) {
        // Wrapping the original handler inside a function that will filter
        // the feature by id and return the feature before handled by MapLibre as a second parameter
        // All features returned by Maplibre are included in the argument "features"
        this.addToEventProxy(type, (latLng, feature, features, sourceAndLayers) => {
            if (this.mapToInternalFeature && features) {
                const topFeature = this.mapToInternalFeature(features[0]) as T;

                return handler(latLng, topFeature, features, sourceAndLayers);
            } else {
                return handler(latLng, feature as T, features, sourceAndLayers);
            }
        });
    }

    /**
     * Remove event handlers for event type
     * @param type
     */
    off(type: EventType) {
        this.removeFromEventProxy(type);
    }
}
