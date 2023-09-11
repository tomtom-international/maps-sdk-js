import { MapGeoJSONFeature } from "maplibre-gl";
import { EventsProxy } from "./EventsProxy";
import { EventType, SourceWithLayers, UserEventHandler } from "./types";

export class EventsModule<T = MapGeoJSONFeature> {
    constructor(
        private readonly eventProxy: EventsProxy,
        private readonly sourceWithLayers: SourceWithLayers
    ) {}

    /**
     * Add event handler of an event type
     * @param type
     * @param handler
     */
    on(type: EventType, handler: UserEventHandler<T>) {
        this.eventProxy.addEventHandler(this.sourceWithLayers, handler, type);
    }

    /**
     * Remove event handlers for event type
     * @param type
     */
    off(type: EventType) {
        this.eventProxy.remove(this.sourceWithLayers, type);
    }
}
