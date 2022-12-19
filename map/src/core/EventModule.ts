import { EventProxy } from "./EventProxy";
import { EventType, HoverClickHandler } from "./types/EventProxy";
import { GeoJSONSourceWithLayers, StyleSourceWithLayers } from "./SourceWithLayers";
import { FeatureCollection } from "geojson";

export class EventModule {
    constructor(
        private eventProxy: EventProxy,
        private mapModule?: StyleSourceWithLayers | GeoJSONSourceWithLayers<FeatureCollection>
    ) {}

    /**
     * Add Event to the EventProxy list
     * @private
     * @ignore
     */
    private addToEventProxy(type: EventType, callback: HoverClickHandler) {
        if (this.mapModule) {
            this.eventProxy.addEventListener(this.mapModule, callback, type);
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
     * Add an event to map layer.
     * @param type
     * @param callback
     */
    on(type: EventType, callback: HoverClickHandler) {
        this.addToEventProxy(type, callback);
    }

    /**
     * Remove an event from map layer.
     * @param type
     */
    off(type: EventType) {
        this.removeFromEventProxy(type);
    }
}
