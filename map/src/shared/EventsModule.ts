import { MapGeoJSONFeature } from "maplibre-gl";
import { mapToInternalFeatures } from "./mapUtils";
import { EventsProxy } from "./EventsProxy";
import { GeoJSONSourceWithLayers } from "./SourceWithLayers";
import { EventType, HoverClickHandler, SourceWithLayers } from "./types";

export class EventsModule<T = MapGeoJSONFeature> {
    constructor(private eventProxy: EventsProxy, private mapModule?: SourceWithLayers) {}

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
        // Wrapping the original handler inside a function that for GeoJSON modules will filter
        // the feature by id and return the feature before being handled by MapLibre as a second parameter
        // For Vector tiles we will be casting to the map geojson feature itself.
        // All features returned by Maplibre are included in the argument "features"
        this.addToEventProxy(type, (latLng, feature, features, sourceAndLayers) => {
            if (this.mapModule instanceof GeoJSONSourceWithLayers && features) {
                return handler(
                    latLng,
                    mapToInternalFeatures(this.mapModule, features[0]) as T,
                    features,
                    sourceAndLayers
                );
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
